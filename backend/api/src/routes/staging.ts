import { Router, Request, Response } from "express";
import { z } from "zod";
import { createClient } from "../lib/supabase";
import { generateStaging, getPredictionStatus } from "../lib/replicate";
import type { StagingStyle } from "../lib/replicate";
import {
  sendStagingCompletedEmail,
  sendAdminNewProjectEmail,
} from "../lib/email";

export const stagingRouter = Router();

const generateSchema = z.object({
  projectId: z.string().uuid(),
  imageUrl: z.string().url(),
  style: z.enum([
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
    "renovation",
    "declutter",
  ]),
  userId: z.string().uuid(),
});

// POST /staging/generate — kick off AI generation
stagingRouter.post("/generate", async (req: Request, res: Response) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { projectId, imageUrl, style, userId } = parsed.data;
  const supabase = createClient();

  // Check user credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining, plan")
    .eq("id", userId)
    .single();

  if (!profile || profile.credits_remaining <= 0) {
    return res.status(402).json({ error: "Insufficient credits" });
  }

  // Update project to processing
  await supabase
    .from("projects")
    .update({ status: "processing" })
    .eq("id", projectId);

  try {
    // Start AI generation
    const result = await generateStaging(imageUrl, style as StagingStyle);

    // Store prediction ID
    await supabase
      .from("projects")
      .update({ replicate_prediction_id: result.predictionId })
      .eq("id", projectId);

    // Deduct 1 credit
    await supabase
      .from("profiles")
      .update({ credits_remaining: profile.credits_remaining - 1 })
      .eq("id", userId);

    // Log credit transaction
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      project_id: projectId,
      amount: -1,
      description: `AI staging - ${style} style`,
    });

    // Poll for result in background — pass along context for email notification
    pollForResult(projectId, result.predictionId, userId, style, supabase);

    // Notify admin of new project (fire-and-forget)
    void Promise.resolve(
      supabase.from("profiles").select("email").eq("id", userId).single(),
    )
      .then(({ data: ownerProfile }) => {
        if (ownerProfile?.email) {
          sendAdminNewProjectEmail({
            userEmail: ownerProfile.email,
            projectId,
            projectName: projectId,
            style,
          }).catch(console.error);
        }
      })
      .catch(() => null);

    return res.json({
      success: true,
      predictionId: result.predictionId,
      projectId,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Staging] Error:", errMsg);

    await supabase
      .from("projects")
      .update({
        status: "failed",
        error_message: errMsg,
      })
      .eq("id", projectId);

    return res.status(500).json({ error: errMsg });
  }
});

// GET /staging/status/:predictionId — check status
stagingRouter.get(
  "/status/:predictionId",
  async (req: Request, res: Response) => {
    try {
      const result = await getPredictionStatus(req.params.predictionId);
      return res.json(result);
    } catch (error_) {
      console.error("Failed to get prediction status:", error_);
      return res.status(500).json({ error: "Failed to get status" });
    }
  },
);

// Background polling helper
async function pollForResult(
  projectId: string,
  predictionId: string,
  userId: string,
  style: string,
  supabase: ReturnType<typeof createClient>,
) {
  const MAX_POLLS = 30;
  const POLL_INTERVAL = 3000; // 3 seconds

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

    const result = await getPredictionStatus(predictionId);

    if (result.status === "succeeded" && result.outputUrl) {
      // Get project name + user email for notification
      const [{ data: project }, { data: profile }] = await Promise.all([
        supabase.from("projects").select("name").eq("id", projectId).single(),
        supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single(),
      ]);

      await supabase
        .from("projects")
        .update({
          status: "completed",
          staged_image_url: result.outputUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      // Email user — fire-and-forget
      if (profile?.email) {
        sendStagingCompletedEmail({
          to: profile.email,
          name: profile.full_name || profile.email.split("@")[0],
          projectId,
          projectName: project?.name || "Your project",
        }).catch(console.error);
      }

      return;
    }

    if (result.status === "failed") {
      await supabase
        .from("projects")
        .update({
          status: "failed",
          error_message: "AI generation failed",
        })
        .eq("id", projectId);
      return;
    }
  }

  // Timeout
  await supabase
    .from("projects")
    .update({ status: "failed", error_message: "Generation timed out" })
    .eq("id", projectId);
}
