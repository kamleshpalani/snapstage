"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import UploadZone from "@/components/UploadZone";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

const STAGING_STYLES = [
  {
    id: "modern",
    label: "Modern",
    emoji: "🏙️",
    description: "Clean lines, neutral tones",
  },
  {
    id: "scandinavian",
    label: "Scandinavian",
    emoji: "🌿",
    description: "Minimalist & cozy",
  },
  {
    id: "luxury",
    label: "Luxury",
    emoji: "✨",
    description: "High-end & elegant",
  },
  {
    id: "coastal",
    label: "Coastal",
    emoji: "🌊",
    description: "Light, airy beach vibes",
  },
  {
    id: "industrial",
    label: "Industrial",
    emoji: "⚙️",
    description: "Raw, urban aesthetic",
  },
  {
    id: "traditional",
    label: "Traditional",
    emoji: "🏡",
    description: "Classic & timeless",
  },
];

export default function NewStagingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) return err.message;
      if (err && typeof err === "object") {
        const e = err as Record<string, unknown>;
        if (typeof e.message === "string" && e.message) return e.message;
        if (typeof e.error === "string") return e.error;
        if (typeof e.details === "string") return e.details;
        return JSON.stringify(err);
      }
      return "Something went wrong. Please try again.";
    };

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated. Please sign in again.");

      // Ensure profile row exists (safety upsert in case trigger didn't fire)
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, email: user.email ?? "" },
          { onConflict: "id", ignoreDuplicates: true },
        );
      if (profileError)
        throw new Error(
          `Profile setup failed: ${getErrorMessage(profileError)}`,
        );

      // 1. Upload original image to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("room-images")
        .upload(filePath, file);

      if (uploadError)
        throw new Error(`Upload failed: ${getErrorMessage(uploadError)}`);

      // 2. Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("room-images").getPublicUrl(filePath);

      // 3. Create project record
      const { data: project, error: dbError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name:
            projectName || `Room Staging ${new Date().toLocaleDateString()}`,
          original_image_url: publicUrl,
          style: selectedStyle,
          status: "pending",
        })
        .select()
        .single();

      if (dbError)
        throw new Error(
          `Failed to create project: ${getErrorMessage(dbError)}`,
        );

      // 4. Trigger AI staging via Next.js server route (non-blocking)
      fetch("/api/staging/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          imageUrl: publicUrl,
          style: selectedStyle,
        }),
      }).catch((fetchErr) => console.error("Staging trigger error:", fetchErr));

      router.push(`/dashboard/projects/${project.id}`);
    } catch (err: unknown) {
      console.error("New staging error:", err);
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Staging</h1>
          <p className="text-gray-500 text-sm">
            Upload a room photo and choose your style
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Project Name */}
        <div className="card p-6 mb-6">
          <label className="label text-base font-semibold text-gray-900">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="input"
            placeholder="e.g. Living Room - 123 Main St"
          />
        </div>

        {/* Image Upload */}
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Upload Room Photo
          </h2>
          <UploadZone onFileSelect={handleFileSelect} preview={preview} />
          <p className="text-xs text-gray-400 mt-3">
            Supported: JPG, PNG, WebP · Max 10MB · Best results with well-lit,
            wide-angle shots
          </p>
        </div>

        {/* Style Selection */}
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Choose Style
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STAGING_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyle(style.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  selectedStyle === style.id
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="text-2xl mb-1">{style.emoji}</div>
                <div className="font-semibold text-gray-900 text-sm">
                  {style.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {style.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!file || loading}
          className="btn-primary w-full gap-2 text-base py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating staging...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Staged Room
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          This will use 1 credit · Usually takes 30–90 seconds
        </p>
      </form>
    </div>
  );
}
