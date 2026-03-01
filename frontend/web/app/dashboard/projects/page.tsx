import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const statusColor: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    processing: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
    pending: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Projects</h1>
          <p className="text-slate-500 text-sm mt-1">
            {projects?.length ?? 0} total stagings
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="btn-primary flex items-center gap-2"
        >
          <span>+ New Staging</span>
        </Link>
      </div>

      {projects?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="card card-hover group overflow-hidden"
            >
              <div className="relative aspect-video bg-slate-100 overflow-hidden rounded-lg mb-4">
                {project.staged_image_url ? (
                  <img
                    src={project.staged_image_url}
                    alt="Staged room"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={project.original_image_url}
                    alt="Original room"
                    className="w-full h-full object-cover opacity-60"
                  />
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      statusColor[project.status] ??
                      "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {project.status.toUpperCase()}
                  </span>
                </div>
                {project.status === "processing" && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 capitalize">
                  {(project.style ?? "").replaceAll("_", " ")}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(project.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            No projects yet
          </h2>
          <p className="text-slate-400 mb-6">
            Upload your first room photo to get started.
          </p>
          <Link href="/dashboard/new" className="btn-primary inline-block">
            Create First Staging
          </Link>
        </div>
      )}
    </div>
  );
}
