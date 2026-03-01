/**
 * previewFlow.ts
 * Routes for the Preview → Approve → Generate HD → Download workflow.
 *
 * POST   /staging/v2/preview              — queue preview generation
 * GET    /staging/v2/request/:requestId   — poll status + get output URLs
 * POST   /staging/v2/regenerate/:requestId — regenerate preview (rate-limited)
 * POST   /staging/v2/approve/:requestId   — approve preview, gate HD
 * POST   /staging/v2/generate-hd/:requestId — consume 1 credit, queue HD
 * GET    /staging/v2/request/:requestId/download-hd — ownership-gated signed URL
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import { createClient } from "../lib/supabase";
import {
  generateStagingPreview,
  generateStagingHd,
  getPredictionStatus,
} from "../lib/replicate";
import type { StagingStyle } from "../lib/replicate";
import {
  fetchImageBuffer,
  applyPreviewWatermark,
  processHdImage,
} from "../lib/watermark";
import {
  uploadBuffer,
  createSignedUrl,
  createHdDownloadUrl,
  buildStoragePath,
} from "../lib/storage";
import { sendStagingCompletedEmail } from "../lib/email";

export const previewFlowRouter = Router();

// ─── Rate limit config ────────────────────────────────────────────────────────
const MAX_REGENS_PER_HOUR = 10;
const REGEN_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ─── Zod schemas ─────────────────────────────────────────────────────────────
const STYLE_VALUES = [
  "modern",
  "scandinavian",
  "luxury",
  "coastal",
  "industrial",
  "traditional",
  "bohemian",
  "japandi",
  "farmhouse",
  "art_deco",
  "mediterranean",
  "mid_century",
  "minimalist",
  "maximalist",
  "contemporary",
  "rustic",
  "eclectic",
  "french_country",
  "hamptons",
  "tropical",
  "wabi_sabi",
  "hollywood_regency",
  "craftsman",
  "victorian",
  "bauhaus",
  "biophilic",
  "zen",
  "urban_modern",
  "dark_academia",
  "cottagecore",
  "southwestern",
  "moroccan",
  "japanese_modern",
  "korean_minimal",
  "chinoiserie",
  "italian_villa",
  "tuscan",
  "parisian",
  "brooklyn_loft",
  "alpine",
  "transitional",
  "organic_modern",
  "moody_dark",
  "retro_70s",
  "futuristic",
  "grandmillennial",
  "art_nouveau",
  "neoclassical",
  "ski_chalet",
  "renovation",
  "declutter",
] as const;

const previewSchema = z.object({
  projectId: z.string().uuid(),
  imageUrl: z.string().url(),
  style: z.enum(STYLE_VALUES),
  userId: z.string().uuid(),
});

const approveSchema = z.object({ userId: z.string().uuid() });
const generateHdSchema = z.object({ userId: z.string().uuid() });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildOptionsHash(style: string): string {
  return crypto.createHash("md5").update(style).digest("hex");
}

async function auditLog(
  supabase: ReturnType<typeof createClient>,
  params: {
    userId: string | null;
    event: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await supabase.from("audit_logs").insert({
    user_id: params.userId,
    event: params.event,
    resource_id: params.resourceId,
    metadata: params.metadata ?? {},
  });
}

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - REGEN_WINDOW_MS).toISOString();

  const { data: rows } = await supabase
    .from("preview_rate_limits")
    .select("regen_count, window_start")
    .eq("user_id", userId)
    .gte("window_start", windowStart)
    .order("window_start", { ascending: false })
    .limit(1);

  const current = rows?.[0];
  const count = current?.regen_count ?? 0;

  if (count >= MAX_REGENS_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  // Upsert rate-limit window
  if (current) {
    await supabase
      .from("preview_rate_limits")
      .update({ regen_count: count + 1 })
      .eq("user_id", userId)
      .eq("window_start", current.window_start);
  } else {
    await supabase.from("preview_rate_limits").insert({
      user_id: userId,
      window_start: new Date().toISOString(),
      regen_count: 1,
    });
  }

  return { allowed: true, remaining: MAX_REGENS_PER_HOUR - count - 1 };
}

// ─── Background: process & store preview output ───────────────────────────────
async function processPreviewInBackground(
  requestId: string,
  predictionId: string,
  userId: string,
  supabase: ReturnType<typeof createClient>,
) {
  const MAX_POLLS = 30;
  const POLL_INTERVAL = 4000;

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));

    const result = await getPredictionStatus(predictionId);

    if (result.status === "succeeded" && result.outputUrl) {
      try {
        // Fetch the raw AI output
        const rawBuffer = await fetchImageBuffer(result.outputUrl);

        // Apply watermark + resize to 1024px
        const { buffer, width, height } =
          await applyPreviewWatermark(rawBuffer);

        // Upload to private storage
        const storagePath = buildStoragePath(userId, requestId, "preview");
        await uploadBuffer(buffer, storagePath, "image/png");

        // Create a 1-hour signed URL
        const { signedUrl, expiresAt } = await createSignedUrl(
          storagePath,
          3600,
        );

        // Store output record
        await supabase.from("staging_outputs").insert({
          request_id: requestId,
          output_type: "preview",
          storage_path: storagePath,
          url: signedUrl,
          width,
          height,
          watermarked: true,
          file_size_bytes: buffer.byteLength,
          expires_at: expiresAt.toISOString(),
        });

        // Update request status
        await supabase
          .from("staging_requests")
          .update({
            status: "preview_ready",
            updated_at: new Date().toISOString(),
          })
          .eq("id", requestId);

        await auditLog(supabase, {
          userId,
          event: "preview.ready",
          resourceId: requestId,
          metadata: { width, height },
        });

        return;
      } catch (err) {
        console.error("[Preview] Post-process error:", err);
        await supabase
          .from("staging_requests")
          .update({ status: "failed", error_message: String(err) })
          .eq("id", requestId);
        return;
      }
    }

    if (result.status === "failed") {
      await supabase
        .from("staging_requests")
        .update({ status: "failed", error_message: "AI generation failed" })
        .eq("id", requestId);
      return;
    }
  }

  await supabase
    .from("staging_requests")
    .update({ status: "failed", error_message: "Preview generation timed out" })
    .eq("id", requestId);
}

// ─── Background: process & store HD output ───────────────────────────────────
async function processHdInBackground(
  requestId: string,
  predictionId: string,
  userId: string,
  projectId: string,
  supabase: ReturnType<typeof createClient>,
) {
  const MAX_POLLS = 40;
  const POLL_INTERVAL = 4000;

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));

    const result = await getPredictionStatus(predictionId);

    if (result.status === "succeeded" && result.outputUrl) {
      try {
        const rawBuffer = await fetchImageBuffer(result.outputUrl);
        const { buffer, width, height } = await processHdImage(rawBuffer);

        const storagePath = buildStoragePath(userId, requestId, "hd");
        await uploadBuffer(buffer, storagePath, "image/png");

        // HD: don't store signed URL — generate on-demand at download time
        await supabase.from("staging_outputs").insert({
          request_id: requestId,
          output_type: "hd",
          storage_path: storagePath,
          url: storagePath, // path only; signed URL generated at download
          width,
          height,
          watermarked: false,
          file_size_bytes: buffer.byteLength,
          expires_at: null,
        });

        // Update request + project
        await supabase
          .from("staging_requests")
          .update({ status: "hd_ready", updated_at: new Date().toISOString() })
          .eq("id", requestId);

        await supabase
          .from("projects")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", projectId);

        // Notify user by email
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single();

        const { data: project } = await supabase
          .from("projects")
          .select("name")
          .eq("id", projectId)
          .single();

        if (profile?.email) {
          sendStagingCompletedEmail({
            to: profile.email,
            name: profile.full_name || profile.email.split("@")[0],
            projectId,
            projectName: project?.name || "Your project",
          }).catch(console.error);
        }

        await auditLog(supabase, {
          userId,
          event: "hd.ready",
          resourceId: requestId,
          metadata: { width, height },
        });

        return;
      } catch (err) {
        console.error("[HD] Post-process error:", err);
        await supabase
          .from("staging_requests")
          .update({ status: "failed", error_message: String(err) })
          .eq("id", requestId);
        return;
      }
    }

    if (result.status === "failed") {
      await supabase
        .from("staging_requests")
        .update({ status: "failed", error_message: "HD generation failed" })
        .eq("id", requestId);
      return;
    }
  }

  await supabase
    .from("staging_requests")
    .update({ status: "failed", error_message: "HD generation timed out" })
    .eq("id", requestId);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /staging/v2/preview
// Queue a new preview. Idempotent: returns existing request if same options_hash.
// ─────────────────────────────────────────────────────────────────────────────
previewFlowRouter.post("/preview", async (req: Request, res: Response) => {
  const parsed = previewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { projectId, imageUrl, style, userId } = parsed.data;
  const optionsHash = buildOptionsHash(style);
  const supabase = createClient();

  // Idempotency: if same project+hash is in active state, return it
  const { data: existing } = await supabase
    .from("staging_requests")
    .select("*")
    .eq("project_id", projectId)
    .eq("options_hash", optionsHash)
    .not("status", "in", '("hd_ready","failed")')
    .maybeSingle();

  if (existing) {
    return res.json({
      requestId: existing.id,
      status: existing.status,
      message: "Existing request returned (idempotent)",
    });
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (!project) {
    return res
      .status(403)
      .json({ error: "Project not found or access denied" });
  }

  // Create staging request
  const { data: request, error: insertErr } = await supabase
    .from("staging_requests")
    .insert({
      user_id: userId,
      project_id: projectId,
      original_image_url: imageUrl,
      style,
      options_hash: optionsHash,
      status: "preview_generating",
    })
    .select()
    .single();

  if (insertErr || !request) {
    return res.status(500).json({ error: "Failed to create staging request" });
  }

  // Update project status
  await supabase
    .from("projects")
    .update({ status: "processing" })
    .eq("id", projectId);

  try {
    // Queue preview (lower quality for speed)
    const prediction = await generateStagingPreview(
      imageUrl,
      style as StagingStyle,
    );

    await supabase
      .from("staging_requests")
      .update({ preview_prediction_id: prediction.predictionId })
      .eq("id", request.id);

    // Process in background
    processPreviewInBackground(
      request.id,
      prediction.predictionId,
      userId,
      supabase,
    );

    await auditLog(supabase, {
      userId,
      event: "preview.queued",
      resourceId: request.id,
      metadata: { style, projectId },
    });

    return res.status(202).json({
      requestId: request.id,
      status: "preview_generating",
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("staging_requests")
      .update({ status: "failed", error_message: errMsg })
      .eq("id", request.id);
    await supabase
      .from("projects")
      .update({ status: "failed" })
      .eq("id", projectId);
    return res.status(500).json({ error: errMsg });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /staging/v2/request/:requestId
// Poll status + get output URLs. Refreshes preview signed URL if near expiry.
// ─────────────────────────────────────────────────────────────────────────────
previewFlowRouter.get(
  "/request/:requestId",
  async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const userId = req.query.userId as string;

    if (!userId) return res.status(400).json({ error: "userId required" });

    const supabase = createClient();

    const { data: request } = await supabase
      .from("staging_requests")
      .select("*")
      .eq("id", requestId)
      .eq("user_id", userId)
      .single();

    if (!request) {
      return res
        .status(404)
        .json({ error: "Request not found or access denied" });
    }

    // Get outputs (data can be null on error, so coerce to [])
    const { data: rawOutputs } = await supabase
      .from("staging_outputs")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });
    const outputs = rawOutputs ?? [];

    // Auto-refresh preview signed URL if <5 minutes remain before expiry
    let previewOutput = outputs.find((o) => o.output_type === "preview");
    if (previewOutput?.storage_path && previewOutput.expires_at) {
      const expiresAt = new Date(previewOutput.expires_at);
      const minsLeft = (expiresAt.getTime() - Date.now()) / 60000;
      if (minsLeft < 5) {
        try {
          const { signedUrl, expiresAt: newExpiry } = await createSignedUrl(
            previewOutput.storage_path,
            3600,
          );
          await supabase
            .from("staging_outputs")
            .update({ url: signedUrl, expires_at: newExpiry.toISOString() })
            .eq("id", previewOutput.id);
          previewOutput = { ...previewOutput, url: signedUrl };
        } catch (_) {
          // Non-fatal — return stale URL
        }
      }
    }

    return res.json({
      requestId: request.id,
      status: request.status,
      style: request.style,
      approvedAt: request.approved_at,
      errorMessage: request.error_message,
      regenCount: request.preview_regen_count,
      preview: previewOutput
        ? {
            url: previewOutput.url,
            width: previewOutput.width,
            height: previewOutput.height,
          }
        : null,
      hd: outputs.find((o) => o.output_type === "hd") ? { ready: true } : null,
    });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /staging/v2/regenerate/:requestId
// Regenerate preview with same style. Rate-limited (10/hour).
// ─────────────────────────────────────────────────────────────────────────────
previewFlowRouter.post(
  "/regenerate/:requestId",
  async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { userId } = req.body as { userId?: string };

    if (!userId) return res.status(400).json({ error: "userId required" });

    const supabase = createClient();

    const { data: request } = await supabase
      .from("staging_requests")
      .select("*")
      .eq("id", requestId)
      .eq("user_id", userId)
      .single();

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Can only regenerate from preview_ready or failed state
    if (!["preview_ready", "failed"].includes(request.status)) {
      return res.status(409).json({
        error: `Cannot regenerate from status: ${request.status}`,
      });
    }

    // Cannot regenerate an approved request without un-approving
    if (request.approved_at) {
      return res.status(409).json({
        error:
          "Cannot regenerate an approved preview. Please un-approve first.",
      });
    }

    // Rate limit check
    const { allowed, remaining } = await checkRateLimit(supabase, userId);
    if (!allowed) {
      return res.status(429).json({
        error: "Preview regeneration limit reached (10/hour). Please wait.",
        retryAfterMs: REGEN_WINDOW_MS,
      });
    }

    // Delete old preview output
    await supabase
      .from("staging_outputs")
      .delete()
      .eq("request_id", requestId)
      .eq("output_type", "preview");

    // Update status + increment regen count
    await supabase
      .from("staging_requests")
      .update({
        status: "preview_generating",
        preview_regen_count: request.preview_regen_count + 1,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    try {
      const prediction = await generateStagingPreview(
        request.original_image_url,
        request.style as StagingStyle,
      );

      await supabase
        .from("staging_requests")
        .update({ preview_prediction_id: prediction.predictionId })
        .eq("id", requestId);

      processPreviewInBackground(
        requestId,
        prediction.predictionId,
        userId,
        supabase,
      );

      await auditLog(supabase, {
        userId,
        event: "preview.regenerated",
        resourceId: requestId,
        metadata: { regenCount: request.preview_regen_count + 1, remaining },
      });

      return res.json({
        requestId,
        status: "preview_generating",
        regenCount: request.preview_regen_count + 1,
        regenRemaining: remaining,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await supabase
        .from("staging_requests")
        .update({ status: "failed", error_message: errMsg })
        .eq("id", requestId);
      return res.status(500).json({ error: errMsg });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /staging/v2/approve/:requestId
// Mark the preview as approved. Gating condition for HD generation.
// ─────────────────────────────────────────────────────────────────────────────
previewFlowRouter.post(
  "/approve/:requestId",
  async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const parsed = approveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { userId } = parsed.data;
    const supabase = createClient();

    const { data: request } = await supabase
      .from("staging_requests")
      .select("*")
      .eq("id", requestId)
      .eq("user_id", userId)
      .single();

    if (!request) {
      return res
        .status(404)
        .json({ error: "Request not found or access denied" });
    }

    if (request.status !== "preview_ready") {
      return res.status(409).json({
        error: `Cannot approve from status: ${request.status}. Preview must be ready first.`,
      });
    }

    await supabase
      .from("staging_requests")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    await auditLog(supabase, {
      userId,
      event: "preview.approved",
      resourceId: requestId,
    });

    return res.json({ requestId, status: "approved" });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /staging/v2/generate-hd/:requestId
// Requires approved preview + sufficient credits. Deducts 1 credit, queues HD.
// ─────────────────────────────────────────────────────────────────────────────
previewFlowRouter.post(
  "/generate-hd/:requestId",
  async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const parsed = generateHdSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { userId } = parsed.data;
    const supabase = createClient();

    const { data: request } = await supabase
      .from("staging_requests")
      .select("*")
      .eq("id", requestId)
      .eq("user_id", userId)
      .single();

    if (!request) {
      return res
        .status(404)
        .json({ error: "Request not found or access denied" });
    }

    // Must be approved
    if (!request.approved_at || request.status !== "approved") {
      return res.status(403).json({
        error: "Preview must be approved before generating HD.",
      });
    }

    // Idempotency: don't charge twice
    if (request.hd_credit_deducted) {
      return res.json({
        requestId,
        status: request.status,
        message: "HD already queued",
      });
    }

    // Check credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_remaining, plan")
      .eq("id", userId)
      .single();

    if (!profile || profile.credits_remaining <= 0) {
      return res.status(402).json({
        error: "Insufficient credits. Please purchase more to download HD.",
      });
    }

    // Deduct credit atomically
    const { error: creditErr } = await supabase
      .from("profiles")
      .update({ credits_remaining: profile.credits_remaining - 1 })
      .eq("id", userId)
      .eq("credits_remaining", profile.credits_remaining); // optimistic lock

    if (creditErr) {
      return res
        .status(409)
        .json({ error: "Credit deduction conflict. Please retry." });
    }

    // Log the transaction
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      project_id: request.project_id,
      amount: -1,
      description: `HD staging - ${request.style}`,
    });

    // Mark credit as deducted + update status
    await supabase
      .from("staging_requests")
      .update({
        status: "hd_generating",
        hd_credit_deducted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    try {
      const prediction = await generateStagingHd(
        request.original_image_url,
        request.style as StagingStyle,
      );

      await supabase
        .from("staging_requests")
        .update({ hd_prediction_id: prediction.predictionId })
        .eq("id", requestId);

      processHdInBackground(
        requestId,
        prediction.predictionId,
        userId,
        request.project_id,
        supabase,
      );

      await auditLog(supabase, {
        userId,
        event: "hd.queued",
        resourceId: requestId,
        metadata: {
          style: request.style,
          creditsRemaining: profile.credits_remaining - 1,
        },
      });

      return res.status(202).json({
        requestId,
        status: "hd_generating",
        creditsRemaining: profile.credits_remaining - 1,
      });
    } catch (err) {
      // Refund credit on Replicate API failure
      await supabase
        .from("profiles")
        .update({ credits_remaining: profile.credits_remaining })
        .eq("id", userId);
      await supabase
        .from("staging_requests")
        .update({ status: "approved", hd_credit_deducted: false })
        .eq("id", requestId);

      const errMsg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: errMsg });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /staging/v2/request/:requestId/download-hd
// Ownership-gated signed HD download URL (7-day expiry).
// ─────────────────────────────────────────────────────────────────────────────
previewFlowRouter.get(
  "/request/:requestId/download-hd",
  async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const userId = req.query.userId as string;

    if (!userId) return res.status(400).json({ error: "userId required" });

    const supabase = createClient();

    // Ownership + status check
    const { data: request } = await supabase
      .from("staging_requests")
      .select("id, user_id, status, hd_credit_deducted")
      .eq("id", requestId)
      .eq("user_id", userId)
      .single();

    if (!request) {
      return res
        .status(404)
        .json({ error: "Request not found or access denied" });
    }

    if (request.status !== "hd_ready") {
      return res.status(403).json({
        error: `HD not ready. Current status: ${request.status}`,
      });
    }

    if (!request.hd_credit_deducted) {
      return res
        .status(403)
        .json({ error: "HD access requires credit payment." });
    }

    // Get HD output record
    const { data: output } = await supabase
      .from("staging_outputs")
      .select("*")
      .eq("request_id", requestId)
      .eq("output_type", "hd")
      .single();

    if (!output?.storage_path) {
      return res.status(404).json({ error: "HD output not found" });
    }

    try {
      const signedUrl = await createHdDownloadUrl(output.storage_path);

      await auditLog(supabase, {
        userId,
        event: "hd.downloaded",
        resourceId: requestId,
        metadata: { width: output.width, height: output.height },
      });

      return res.json({
        downloadUrl: signedUrl,
        width: output.width,
        height: output.height,
        fileSizeBytes: output.file_size_bytes,
        expiresIn: "7 days",
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: errMsg });
    }
  },
);
