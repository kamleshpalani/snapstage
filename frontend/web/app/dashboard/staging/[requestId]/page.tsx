"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import JobStatusBadge from "@/components/JobStatusBadge";
import CreditBanner from "@/components/CreditBanner";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status =
  | "queued"
  | "preview_generating"
  | "preview_ready"
  | "approved"
  | "hd_generating"
  | "hd_ready"
  | "failed";

interface StagingRequest {
  id: string;
  status: Status;
  style: string;
  originalImageUrl: string;
  previewUrl: string | null;
  hdUrl: string | null;
  hdCreditDeducted: boolean;
  approvedAt: string | null;
  errorMessage: string | null;
  regenCount: number;
  regenRemaining: number;
}

interface PollResponse {
  request: StagingRequest;
  creditsRemaining: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3000;

const GENERATING_STATUSES = new Set<Status>([
  "queued",
  "preview_generating",
  "hd_generating",
]);
const isGenerating = (s: Status) => GENERATING_STATUSES.has(s);

const STYLE_LABELS: Record<string, string> = {
  modern: "Modern",
  scandinavian: "Scandinavian",
  luxury: "Luxury",
  coastal: "Coastal",
  industrial: "Industrial",
  traditional: "Traditional",
  bohemian: "Bohemian",
  japandi: "Japandi",
  farmhouse: "Farmhouse",
  art_deco: "Art Deco",
  mediterranean: "Mediterranean",
  mid_century: "Mid-Century",
  minimalist: "Minimalist",
  maximalist: "Maximalist",
  contemporary: "Contemporary",
  eclectic: "Eclectic",
  hollywood_regency: "Hollywood Regency",
  transitional: "Transitional",
  biophilic: "Biophilic",
  zen: "Zen",
  vintage: "Vintage",
  retro: "Retro",
  preppy: "Preppy",
  cottage_core: "Cottage Core",
  grandmillennial: "Grandmillennial",
  french_provincial: "French Provincial",
  tuscan: "Tuscan",
  greek_revival: "Greek Revival",
  moroccan: "Moroccan",
  hamptons: "Hamptons",
  california_casual: "California Casual",
  pacific_northwest: "Pacific Northwest",
  southwestern: "Southwestern",
  tropical: "Tropical",
  ski_lodge: "Ski Lodge",
  masculine: "Masculine",
  feminine: "Feminine",
  gender_neutral: "Gender-Neutral",
  kids_room: "Kids Room",
  teen_room: "Teen Room",
  home_office: "Home Office",
  studio_loft: "Studio Loft",
  penthouse: "Penthouse",
  dark_moody: "Dark & Moody",
  light_airy: "Light & Airy",
  monochromatic: "Monochromatic",
  colorful_pop: "Colorful Pop",
  wabi_sabi: "Wabi-Sabi",
  renovation: "Renovation Preview",
  declutter: "Declutter",
};

// ─── Page Component ───────────────────────────────────────────────────────────

export default function StagingWorkflowPage() {
  const { requestId } = useParams<{ requestId: string }>();

  const [data, setData] = useState<PollResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // 'approve' | 'hd' | 'regen' | 'download'
  const [actionError, setActionError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Polling ───────────────────────────────────────────────────────────────

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/staging/v2/request/${requestId}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const json: PollResponse = await res.json();
      setData(json);
      setFetchError(null);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load status",
      );
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    if (!data) return;
    if (isGenerating(data.request.status)) {
      pollRef.current = setTimeout(() => {
        fetchStatus();
      }, POLL_INTERVAL_MS);
    }
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleApprove = async () => {
    setActionLoading("approve");
    setActionError(null);
    try {
      const res = await fetch(`/api/staging/v2/approve/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Approve failed");
      await fetchStatus();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateHd = async () => {
    setActionLoading("hd");
    setActionError(null);
    try {
      const res = await fetch(`/api/staging/v2/generate-hd/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "HD generation failed");
      await fetchStatus();
      // start polling
      setData((prev) =>
        prev
          ? { ...prev, request: { ...prev.request, status: "hd_generating" } }
          : prev,
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "HD generation failed",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async () => {
    setActionLoading("download");
    setActionError(null);
    try {
      const res = await fetch(
        `/api/staging/v2/request/${requestId}/download-hd`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Download failed");
      const url: string = json.downloadUrl;
      window.open(url, "_blank");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerate = async () => {
    setActionLoading("regen");
    setActionError(null);
    try {
      const res = await fetch(`/api/staging/v2/regenerate/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Regeneration failed");
      await fetchStatus();
      setData((prev) =>
        prev
          ? {
              ...prev,
              request: { ...prev.request, status: "preview_generating" },
            }
          : prev,
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Regeneration failed",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (fetchError && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <XCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600">{fetchError}</p>
        <button onClick={fetchStatus} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const { request: req, creditsRemaining } = data;
  const styleLabel = STYLE_LABELS[req.style] ?? req.style;

  const canApprove = req.status === "preview_ready" && !req.approvedAt;
  const canDownload = req.status === "hd_ready";
  const canRegenerate =
    (req.status === "preview_ready" || req.status === "approved") &&
    req.regenRemaining > 0;
  const hdReady = req.status === "hd_ready";

  // Pre-compute step text to avoid nested ternary operators
  let approveStepText: string;
  if (req.approvedAt) {
    approveStepText = "Preview approved \u2713";
  } else if (canApprove) {
    approveStepText = "Happy with the look? Approve it to unlock HD.";
  } else {
    approveStepText = "Waiting for preview\u2026";
  }

  let hdStepText: string;
  if (req.hdCreditDeducted && req.status === "hd_generating") {
    hdStepText = "HD image being generated\u2026";
  } else if (req.hdCreditDeducted) {
    hdStepText = "HD image ready \u2713";
  } else if (req.approvedAt) {
    hdStepText = "Uses 1 credit. Full-resolution, no watermark.";
  } else {
    hdStepText = "Approve preview first.";
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/projects" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {styleLabel} Staging
            </h1>
            <JobStatusBadge status={req.status} />
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            Request ID:{" "}
            <code className="font-mono text-xs">{req.id.slice(0, 8)}…</code>
          </p>
        </div>
      </div>

      {/* ── Action error ── */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {actionError}
          <button
            onClick={() => setActionError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Image panel ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Banner while generating */}
          {isGenerating(req.status) && (
            <div className="card p-4 flex items-center gap-3 border-blue-200 bg-blue-50">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800">
                  {req.status === "hd_generating"
                    ? "Generating HD image…"
                    : "Generating your preview…"}
                </p>
                <p className="text-blue-600 text-sm">
                  Usually takes 30–90 seconds. This page updates automatically.
                </p>
              </div>
            </div>
          )}

          {/* Before / After slider — shows when we have a preview */}
          {req.previewUrl ? (
            <div className="card overflow-hidden">
              <div className="bg-gray-50 border-b px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {hdReady ? "HD Result" : "Watermarked Preview"}
                </span>
                {hdReady && req.hdUrl && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                    ✓ HD Quality
                  </span>
                )}
              </div>
              <BeforeAfterSlider
                beforeSrc={req.originalImageUrl}
                afterSrc={hdReady && req.hdUrl ? req.hdUrl : req.previewUrl}
                beforeLabel="Original"
                afterLabel={hdReady ? "HD Staged" : "Preview"}
              />
            </div>
          ) : (
            /* Placeholder while first preview generates */
            <div className="card p-0 overflow-hidden">
              <div className="bg-gray-100 aspect-[4/3] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
                <p className="text-gray-500 font-medium">Generating preview…</p>
              </div>
            </div>
          )}

          {/* Original image */}
          {req.originalImageUrl && !req.previewUrl && (
            <div className="card p-4">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                Your uploaded photo
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={req.originalImageUrl}
                alt="Original room"
                className="rounded-lg w-full object-cover aspect-[4/3]"
              />
            </div>
          )}
        </div>

        {/* ── Right: Action panel ── */}
        <div className="space-y-4">
          {/* Credits */}
          <div className="card p-4">
            <CreditBanner
              credits={creditsRemaining}
              showHdWarning={req.status === "approved" && !req.hdCreditDeducted}
            />
          </div>

          {/* Step-by-step actions */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Workflow Steps</h3>

            {/* Step 1: Preview */}
            <WorkflowStep
              number={1}
              title="Preview Generated"
              done={!!req.previewUrl}
              active={
                req.status === "preview_generating" || req.status === "queued"
              }
            >
              {req.previewUrl
                ? "Your watermarked preview is ready."
                : "Generating your preview…"}
            </WorkflowStep>

            {/* Step 2: Approve */}
            <WorkflowStep
              number={2}
              title="Approve Preview"
              done={!!req.approvedAt}
              active={req.status === "preview_ready"}
            >
              {approveStepText}
            </WorkflowStep>

            {/* Step 3: Generate HD */}
            <WorkflowStep
              number={3}
              title="Generate HD"
              done={req.hdCreditDeducted}
              active={
                req.status === "approved" || req.status === "hd_generating"
              }
            >
              {hdStepText}
            </WorkflowStep>

            {/* Step 4: Download */}
            <WorkflowStep
              number={4}
              title="Download HD"
              done={hdReady}
              active={hdReady}
            >
              {hdReady
                ? "Your HD image is ready to download."
                : "Generate HD first."}
            </WorkflowStep>
          </div>

          {/* CTA Buttons */}
          <div className="card p-4 space-y-3">
            {/* Approve */}
            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={actionLoading === "approve"}
                className="btn-primary w-full gap-2 disabled:opacity-50"
              >
                {actionLoading === "approve" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Approve Preview
              </button>
            )}

            {/* Generate HD */}
            {req.status === "approved" && !req.hdCreditDeducted && (
              <button
                onClick={handleGenerateHd}
                disabled={actionLoading === "hd" || creditsRemaining === 0}
                className="btn-primary w-full gap-2 disabled:opacity-50"
              >
                {actionLoading === "hd" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate HD — 1 Credit
              </button>
            )}

            {/* HD generating indicator */}
            {req.status === "hd_generating" && (
              <div className="flex items-center justify-center gap-2 py-2 text-purple-700 font-medium text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating HD image…
              </div>
            )}

            {/* Download */}
            {canDownload && (
              <button
                onClick={handleDownload}
                disabled={actionLoading === "download"}
                className="btn-primary w-full gap-2 disabled:opacity-50 bg-green-600 hover:bg-green-700"
              >
                {actionLoading === "download" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download HD Image
              </button>
            )}

            {/* Regenerate */}
            {canRegenerate && (
              <button
                onClick={handleRegenerate}
                disabled={actionLoading === "regen"}
                className="btn-secondary w-full gap-2 disabled:opacity-50 text-sm"
              >
                {actionLoading === "regen" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Regenerate Preview ({req.regenRemaining} left)
              </button>
            )}

            {/* Out of credits CTA */}
            {req.status === "approved" &&
              !req.hdCreditDeducted &&
              creditsRemaining === 0 && (
                <Link
                  href="/dashboard/billing"
                  className="btn-primary w-full text-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Buy Credits to Download HD
                </Link>
              )}
          </div>

          {/* Error state */}
          {req.status === "failed" && (
            <div className="card p-4 border-red-200 bg-red-50">
              <p className="font-semibold text-red-800 text-sm">
                Generation failed
              </p>
              {req.errorMessage && (
                <p className="text-red-600 text-xs mt-1">{req.errorMessage}</p>
              )}
              <Link
                href="/dashboard/new"
                className="btn-secondary text-sm mt-3 w-full text-center block"
              >
                Try Again
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── WorkflowStep ─────────────────────────────────────────────────────────────

function WorkflowStep({
  number,
  title,
  done,
  active,
  children,
}: Readonly<{
  number: number;
  title: string;
  done: boolean;
  active: boolean;
  children: React.ReactNode;
}>) {
  let badgeColor: string;
  if (done) {
    badgeColor = "bg-green-500 text-white";
  } else if (active) {
    badgeColor = "bg-brand-500 text-white";
  } else {
    badgeColor = "bg-gray-200 text-gray-500";
  }

  let titleColor: string;
  if (active) {
    titleColor = "text-brand-700";
  } else if (done) {
    titleColor = "text-green-700";
  } else {
    titleColor = "text-gray-500";
  }

  return (
    <div className="flex gap-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${badgeColor}`}
      >
        {done ? "✓" : number}
      </div>
      <div>
        <p className={`font-medium text-sm ${titleColor}`}>{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{children}</p>
      </div>
    </div>
  );
}
