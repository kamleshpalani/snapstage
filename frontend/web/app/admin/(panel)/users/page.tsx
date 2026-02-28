import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchParams {
  page?: string;
  search?: string;
  plan?: string;
}

async function getUsers(params: SearchParams) {
  const supabase = await createClient();
  const page = Number(params.page) || 1;
  const limit = 20;
  const from = (page - 1) * limit;
  const search = params.search || "";
  const plan = params.plan || "";

  let query = supabase
    .from("profiles")
    .select(
      "id, email, full_name, plan, credits_remaining, is_admin, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }
  if (plan) {
    query = query.eq("plan", plan as "free" | "pro" | "agency" | "payg");
  }

  const { data, count, error } = await query;
  return { users: data ?? [], total: count ?? 0, page, limit, error };
}

const planBadge: Record<string, string> = {
  free: "bg-zinc-800 text-zinc-400",
  pro: "bg-blue-500/15 text-blue-400",
  agency: "bg-violet-500/15 text-violet-400",
  payg: "bg-amber-500/15 text-amber-400",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { users, total, page, limit } = await getUsers(searchParams);
  const totalPages = Math.ceil(total / limit);
  const search = searchParams.search || "";
  const plan = searchParams.plan || "";

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {total} user{total === 1 ? "" : "s"} total
        </p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search email or name…"
            className="pl-9 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 w-64 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
        </div>
        <select
          name="plan"
          defaultValue={plan}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="agency">Agency</option>
          <option value="payg">Pay-as-you-go</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-100 transition-colors"
        >
          Search
        </button>
        {(search || plan) && (
          <Link
            href="/admin/users"
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
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
                User
              </th>
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                Plan
              </th>
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                Credits
              </th>
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                Joined
              </th>
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">
                Role
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-zinc-500">
                  No users found
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-white">{u.email}</p>
                  {u.full_name && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {u.full_name}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      planBadge[u.plan] ?? "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {u.plan}
                  </span>
                </td>
                <td className="px-5 py-3 text-zinc-300">
                  {u.credits_remaining}
                </td>
                <td className="px-5 py-3 text-zinc-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3">
                  {u.is_admin && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/users/${u.id}`}
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
                href={`/admin/users?page=${page - 1}&search=${search}&plan=${plan}`}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/users?page=${page + 1}&search=${search}&plan=${plan}`}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
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
