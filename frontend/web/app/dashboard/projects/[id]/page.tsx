"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  original_image_url: string;
  staged_image_url: string | null;
  style: string;
  status: string;
  created_at: string;
}

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchProject();

    const channel = supabase
      .channel(`project-${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${params.id}`,
        },
        (payload) => setProject(payload.new as Project),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }
    setProject(data);
    setLoading(false);
  };

  const handleRetry = async () => {
    if (!project) return;
    setRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch("/api/staging/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          imageUrl: project.original_image_url,
          style: project.style,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start staging");
      // Update local state optimistically
      setProject((p) => (p ? { ...p, status: "processing" } : p));
    } catch (err) {
      setRetryError(
        err instanceof Error ? err.message : "Failed to start staging",
      );
    } finally {
      setRetrying(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  };

  const statusStyles: Record<string, string> = {
    completed: "bg-green-100 text-green-700 border-green-200",
    processing: "bg-amber-100 text-amber-700 border-amber-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    pending: "bg-slate-100 text-slate-500 border-slate-200",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Project not found.</p>
        <Link
          href="/dashboard/projects"
          className="btn-primary mt-4 inline-block"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/projects"
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
      >
        ← Back to Projects
      </Link>

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 capitalize">
            {project.name || (project.style ?? "").replace(/_/g, " ") + " Room"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {formatDate(project.created_at)}
          </p>
        </div>
        <span
          className={`text-sm font-semibold px-3 py-1 rounded-full border ${
            statusStyles[project.status] ?? statusStyles.pending
          }`}
        >
          {project.status.toUpperCase()}
        </span>
      </div>

      {/* Before / After Slider */}
      {project.staged_image_url && project.status === "completed" ? (
        <div className="rounded-2xl overflow-hidden mb-6 shadow-md">
          <BeforeAfterSlider
            beforeSrc={project.original_image_url}
            afterSrc={project.staged_image_url}
          />
        </div>
      ) : (
        <div className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden mb-6">
          <img
            src={project.original_image_url}
            alt="Original"
            className="w-full h-full object-cover"
          />
          {project.status === "processing" && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-white font-semibold">
                AI is staging your room…
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info + Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Details */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Details
          </h2>
          <dl className="space-y-3">
            <DetailRow
              label="Style"
              value={(project.style ?? "").replace(/_/g, " ").toUpperCase()}
            />
            <DetailRow
              label="Project ID"
              value={project.id.slice(0, 8) + "…"}
            />
          </dl>
        </div>

        {/* Actions */}
        <div className="card flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Actions
          </h2>
          {retryError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {retryError}
            </p>
          )}
          {(project.status === "pending" || project.status === "failed") && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {retrying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />{" "}
                  Starting…
                </>
              ) : (
                <>
                  ✨{" "}
                  {project.status === "failed"
                    ? "Retry Staging"
                    : "Start Staging"}
                </>
              )}
            </button>
          )}
          {project.staged_image_url && project.status === "completed" && (
            <>
              <button
                onClick={() =>
                  handleDownload(
                    project.staged_image_url!,
                    `snapstage-staged-${project.id.slice(0, 8)}.jpg`,
                  )
                }
                disabled={downloading}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {downloading ? "Downloading…" : "⬇ Download Staged Image"}
              </button>
              <button
                onClick={() =>
                  handleDownload(
                    project.original_image_url,
                    `snapstage-original-${project.id.slice(0, 8)}.jpg`,
                  )
                }
                className="btn-secondary flex items-center justify-center gap-2"
              >
                ⬇ Download Original
              </button>
            </>
          )}
          <Link href="/dashboard/new" className="btn-secondary text-center">
            + Stage Another Room
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
