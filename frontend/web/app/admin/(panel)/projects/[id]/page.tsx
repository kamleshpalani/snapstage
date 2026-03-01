import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProjectActions } from "./ProjectActions";

export const dynamic = "force-dynamic";

export default async function AdminProjectDetailPage({
  params,
}: Readonly<{
  params: { id: string };
}>) {
  const supabase = await createClient();
  const projectId = params.id;

  const [{ data: project }, { data: notes }] = await Promise.all([
    supabase
      .from("projects")
      .select(`*, profiles!user_id(id, email, full_name, plan)`)
      .eq("id", projectId)
      .single(),
    supabase
      .from("project_notes")
      .select("id, content, author_email, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
  ]);

  if (!project) notFound();

  const profileData = Array.isArray(project.profiles)
    ? project.profiles[0]
    : project.profiles;
  const user = profileData as {
    id: string;
    email: string;
    full_name?: string;
    plan: string;
  } | null;

  const statusColors: Record<string, string> = {
    completed: "bg-emerald-500/15 text-emerald-400 border-emerald-800",
    processing: "bg-blue-500/15 text-blue-400 border-blue-800",
    failed: "bg-red-500/15 text-red-400 border-red-800",
    pending: "bg-zinc-500/15 text-zinc-400 border-zinc-700",
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/projects"
          className="text-sm text-zinc-500 hover:text-zinc-300 mb-3 inline-block"
        >
          ← Back to projects
        </Link>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {project.style} · {new Date(project.created_at).toLocaleString()}
            </p>
          </div>
          <span
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              statusColors[project.status] ?? "bg-zinc-800 text-zinc-400"
            }`}
          >
            {project.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Images */}
        <div className="space-y-4">
          {project.original_image_url && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-medium text-zinc-500 mb-3">Original</p>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800">
                <Image
                  src={project.original_image_url}
                  alt="Original"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          {project.staged_image_url && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-medium text-zinc-500 mb-3">
                Staged result
              </p>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800">
                <Image
                  src={project.staged_image_url}
                  alt="Staged"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Project info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Details</h2>
            <dl className="space-y-2.5 text-sm">
              {[
                ["Project ID", project.id],
                ["Style", project.style],
                ["Status", project.status],
                ["Prediction ID", project.replicate_prediction_id || "—"],
                ["Error", project.error_message || "—"],
                ["Created", new Date(project.created_at).toLocaleString()],
                ["Updated", new Date(project.updated_at).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-zinc-500 shrink-0">{label}</dt>
                  <dd className="text-white text-right text-xs font-mono truncate">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Linked user */}
          {user && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="font-semibold text-white mb-3">User</h2>
              <p className="text-sm text-white">{user.email}</p>
              <p className="text-xs text-zinc-500 mt-0.5 capitalize">
                {user.plan} plan
              </p>
              <Link
                href={`/admin/users/${user.id}`}
                className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
              >
                View user →
              </Link>
            </div>
          )}

          {/* Admin actions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Actions</h2>
            <ProjectActions
              projectId={project.id}
              currentStatus={project.status}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="font-semibold text-white">Internal notes</h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {(notes ?? []).length === 0 && (
            <p className="px-5 py-6 text-sm text-zinc-500">No notes yet</p>
          )}
          {(notes ?? []).map((n) => (
            <div key={n.id} className="px-5 py-4">
              <p className="text-sm text-white whitespace-pre-wrap">
                {n.content}
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                {n.author_email} · {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
