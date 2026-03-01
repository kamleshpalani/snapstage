import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { UserEditForm } from "./UserEditForm";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: Readonly<{
  params: { id: string };
}>) {
  const supabase = await createClient();
  const userId = params.id;

  const [{ data: profile }, { data: projects }, { data: txns }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("projects")
        .select("id, name, status, style, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("credit_transactions")
        .select("id, amount, description, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (!profile) notFound();

  const statusColors: Record<string, string> = {
    completed: "bg-emerald-500/15 text-emerald-400",
    processing: "bg-blue-500/15 text-blue-400",
    failed: "bg-red-500/15 text-red-400",
    pending: "bg-zinc-500/15 text-zinc-400",
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-zinc-500 hover:text-zinc-300 mb-3 inline-block"
        >
          ← Back to users
        </Link>
        <h1 className="text-2xl font-bold text-white">{profile.email}</h1>
        {profile.full_name && (
          <p className="text-zinc-500 mt-1">{profile.full_name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Profile card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Profile</h2>
          <dl className="space-y-2.5 text-sm">
            {[
              ["ID", profile.id],
              ["Email", profile.email],
              ["Plan", profile.plan],
              [
                "Credits",
                `${profile.credits_remaining} remaining / ${profile.credits_used} used`,
              ],
              ["Stripe ID", profile.stripe_customer_id || "—"],
              ["Admin", profile.is_admin ? "Yes" : "No"],
              ["Joined", new Date(profile.created_at).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-zinc-500 shrink-0">{label}</dt>
                <dd className="text-white text-right truncate">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Edit form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Edit user</h2>
          <UserEditForm user={profile} />
        </div>
      </div>

      {/* Projects */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl mb-6">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">
            Projects ({projects?.length ?? 0})
          </h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {(projects ?? []).length === 0 && (
            <p className="px-5 py-8 text-sm text-zinc-500 text-center">
              No projects
            </p>
          )}
          {(projects ?? []).map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {p.name}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {p.style} · {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                  statusColors[p.status] ?? "bg-zinc-800 text-zinc-400"
                }`}
              >
                {p.status}
              </span>
              <Link
                href={`/admin/projects/${p.id}`}
                className="shrink-0 text-xs text-blue-400 hover:text-blue-300"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Credit transactions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="font-semibold text-white">Credit history (last 20)</h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {(txns ?? []).length === 0 && (
            <p className="px-5 py-8 text-sm text-zinc-500 text-center">
              No transactions
            </p>
          )}
          {(txns ?? []).map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{t.description}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {new Date(t.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`shrink-0 text-sm font-semibold ${
                  t.amount > 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {t.amount > 0 ? "+" : ""}
                {t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
