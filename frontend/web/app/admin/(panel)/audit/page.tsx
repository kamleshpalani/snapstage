import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface SearchParams {
  page?: string;
  actor?: string;
  action?: string;
}

const ACTION_LABELS: Record<string, string> = {
  update_user: "Update user",
  adjust_credits: "Adjust credits",
  update_project_status: "Update project status",
  add_project_note: "Add project note",
  delete_project: "Delete project",
};

export default async function AdminAuditPage({
  searchParams,
}: Readonly<{
  searchParams: SearchParams;
}>) {
  const supabase = await createClient();
  const page = Number(searchParams.page) || 1;
  const limit = 50;
  const from = (page - 1) * limit;
  const actorFilter = searchParams.actor || "";
  const actionFilter = searchParams.action || "";

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (actorFilter) query = query.ilike("actor_email", `%${actorFilter}%`);
  if (actionFilter) query = query.eq("action", actionFilter);

  const { data: logs, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / limit);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-zinc-500 text-sm mt-1">
          All admin actions are logged here
        </p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <input
          name="actor"
          defaultValue={actorFilter}
          placeholder="Filter by admin email…"
          className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 w-56 focus:outline-none"
        />
        <select
          name="action"
          defaultValue={actionFilter}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-100 transition-colors"
        >
          Filter
        </button>
        {(actorFilter || actionFilter) && (
          <Link
            href="/admin/audit"
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                Time
              </th>
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                Admin
              </th>
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                Action
              </th>
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                Target
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {(logs ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-zinc-500">
                  No audit entries yet
                </td>
              </tr>
            )}
            {(logs ?? []).map((log) => (
              <tr
                key={log.id}
                className="hover:bg-zinc-800/50 transition-colors"
              >
                <td className="px-5 py-3 text-zinc-400 whitespace-nowrap text-xs">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-3 text-zinc-300 text-xs">
                  {log.actor_email}
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs font-medium text-white font-mono">
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-zinc-400 text-xs">
                  {log.target_type && (
                    <span className="capitalize">{log.target_type}</span>
                  )}
                  {log.target_id && (
                    <span className="text-zinc-600 ml-1.5 font-mono">
                      {log.target_id.slice(0, 8)}…
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {/* Expandable diff — shows before/after on hover via title */}
                  {(log.before_data || log.after_data) && (
                    <button
                      title={JSON.stringify(
                        { before: log.before_data, after: log.after_data },
                        null,
                        2,
                      )}
                      className="text-xs text-zinc-600 hover:text-zinc-400"
                    >
                      diff
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/audit?page=${page - 1}&actor=${actorFilter}&action=${actionFilter}`}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/audit?page=${page + 1}&actor=${actorFilter}&action=${actionFilter}`}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
