import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, ImageIcon, Zap, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's recent projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(6);

  // Fetch user profile (credits etc)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const stats = [
    {
      label: "Credits Left",
      value: profile?.credits_remaining ?? 3,
      icon: Zap,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      label: "Total Projects",
      value: projects?.length ?? 0,
      icon: ImageIcon,
      color: "text-brand-500",
      bg: "bg-brand-50",
    },
    {
      label: "This Month",
      value:
        projects?.filter((p) => {
          const d = new Date(p.created_at);
          const now = new Date();
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        }).length ?? 0,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-50",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.full_name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your projects.
          </p>
        </div>
        <Link href="/dashboard/new" className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          New Staging
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5 flex items-center gap-4">
            <div
              className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}
            >
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Projects
          </h2>
          <Link
            href="/dashboard/projects"
            className="text-sm text-brand-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        {!projects || projects.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 mb-6">
              Upload your first room photo and see the magic happen.
            </p>
            <Link
              href="/dashboard/new"
              className="btn-primary gap-2 inline-flex"
            >
              <Plus className="w-4 h-4" />
              Create First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="card-hover overflow-hidden group"
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {project.staged_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.staged_image_url}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`badge text-xs font-medium ${
                        project.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : project.status === "processing"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-medium text-gray-900 truncate">
                    {project.name}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
