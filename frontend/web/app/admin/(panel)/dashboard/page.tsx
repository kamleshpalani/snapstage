import { createClient } from "@/lib/supabase/server";
import { Users, Image, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalProjects },
    { count: completed },
    { count: processing },
    { count: failed },
    { data: planData },
    { data: recent },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "processing"),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
    supabase.from("profiles").select("plan"),
    supabase
      .from("projects")
      .select("id, name, status, created_at, profiles!user_id(email)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const plans: Record<string, number> = {};
  (planData || []).forEach((p: { plan: string }) => {
    plans[p.plan] = (plans[p.plan] || 0) + 1;
  });

  return {
    totalUsers: totalUsers ?? 0,
    totalProjects: totalProjects ?? 0,
    completed: completed ?? 0,
    processing: processing ?? 0,
    failed: failed ?? 0,
    plans,
    recent: recent ?? [],
  };
}

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-400",
  processing: "bg-blue-500/15 text-blue-400",
  failed: "bg-red-500/15 text-red-400",
  pending: "bg-zinc-500/15 text-zinc-400",
};

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const kpis = [
    {
      label: "Total users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Total projects",
      value: stats.totalProjects,
      icon: Image,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Processing",
      value: stats.processing,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Failed",
      value: stats.failed,
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Success rate",
      value:
        stats.totalProjects > 0
          ? `${Math.round((stats.completed / stats.totalProjects) * 100)}%`
          : "—",
      icon: TrendingUp,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 mt-1 text-sm">Overview of SnapStage activity</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
          >
            <div className={`inline-flex p-2.5 rounded-lg ${kpi.bg} mb-3`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-sm text-zinc-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent projects */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-semibold text-white">Recent projects</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {stats.recent.length === 0 && (
              <p className="px-5 py-8 text-sm text-zinc-500 text-center">
                No projects yet
              </p>
            )}
            {stats.recent.map((p: {
              id: string;
              name: string;
              status: string;
              created_at: string;
              profiles?: unknown;
            }) => {
              const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
              const userEmail = (profile as { email?: string } | null)?.email;
              return (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {userEmail ?? "—"} ·{" "}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[p.status] ?? "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              );
            })}
          </div>
        </div>

        {/* Plan breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-semibold text-white">Plan breakdown</h2>
          </div>
          <div className="p-5 space-y-3">
            {Object.entries(stats.plans).length === 0 && (
              <p className="text-sm text-zinc-500">No users yet</p>
            )}
            {Object.entries(stats.plans).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300 capitalize">{plan}</span>
                <span className="text-sm font-semibold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
