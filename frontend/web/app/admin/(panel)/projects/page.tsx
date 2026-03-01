import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchParams {
  page?: string;
  search?: string;
  status?: string;
}

async function getProjects(params: SearchParams) {
  const supabase = await createClient();
  const page = Number(params.page) || 1;
  const limit = 20;
  const from = (page - 1) * limit;
  const search = params.search || "";
  const status = params.status || "";

  // Note: admin RLS policy from migration 002 allows admins to see all projects
  let query = supabase
    .from("projects")
    .select(
      `id, name, status, style, created_at, updated_at, error_message,
      profiles!user_id(id, email)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (status)
    query = query.eq(
      "status",
      status as "pending" | "processing" | "completed" | "failed",
    );
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, count, error } = await query;
  return { projects: data ?? [], total: count ?? 0, page, limit, error };
}

const statusBadge: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-400",
  processing: "bg-blue-500/15 text-blue-400 animate-pulse",
  failed: "bg-red-500/15 text-red-400",
  pending: "bg-zinc-500/15 text-zinc-400",
};

export default async function AdminProjectsPage({
  searchParams,
}: Readonly<{
  searchParams: SearchParams;
}>) {
  const { projects, total, page, limit, error } =
    await getProjects(searchParams);
  const totalPages = Math.ceil(total / limit);
  const search = searchParams.search || "";
  const status = searchParams.status || "";

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="text-zinc-500 text-sm mt-1">{total} total</p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search project name…"
            className="pl-9 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 w-60 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-100 transition-colors"
        >
          Search
        </button>
        {(search || status) && (
          <Link
            href="/admin/projects"
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-950 border border-red-800 text-sm text-red-300">
          Error loading projects: {error.message}
        </div>
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                Project
              </th>
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                User
              </th>
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                Style
              </th>
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                Status
              </th>
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                Created
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {projects.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-zinc-500">
                  No projects found
                </td>
              </tr>
            )}
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-white truncate max-w-[180px]">
                    {p.name}
                  </p>
                  {p.error_message && (
                    <p className="text-xs text-red-400 mt-0.5 truncate max-w-[180px]">
                      {p.error_message}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3 text-zinc-400 text-xs">
                  {(Array.isArray(p.profiles)
                    ? (p.profiles[0] as { email: string } | undefined)?.email
                    : (p.profiles as { email: string } | null)?.email) ?? "—"}
                </td>
                <td className="px-5 py-3 text-zinc-400 capitalize">
                  {p.style}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      statusBadge[p.status] ?? "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-zinc-400">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    View →
                  </Link>
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
                href={`/admin/projects?page=${page - 1}&search=${search}&status=${status}`}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/projects?page=${page + 1}&search=${search}&status=${status}`}
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
