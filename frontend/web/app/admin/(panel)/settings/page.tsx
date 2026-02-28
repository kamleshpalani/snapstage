export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const cells = [
    { label: "Backend API URL", value: apiUrl || "⚠ Not configured" },
    { label: "Supabase URL", value: supabaseUrl || "⚠ Not configured" },
    { label: "App URL", value: appUrl || "⚠ Not configured" },
    { label: "Environment", value: process.env.NODE_ENV || "unknown" },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">
          System configuration and environment info
        </p>
      </div>

      {/* Config overview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="font-semibold text-white">Environment</h2>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-zinc-800">
            {cells.map(({ label, value }) => (
              <tr key={label}>
                <td className="px-5 py-3 text-zinc-400 w-44">{label}</td>
                <td
                  className={`px-5 py-3 font-mono text-xs ${
                    value.startsWith("⚠")
                      ? "text-amber-400"
                      : "text-white"
                  }`}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick links */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">Quick links</h2>
        <div className="space-y-2.5">
          {[
            {
              label: "Supabase Dashboard",
              href: `${supabaseUrl?.replace(".supabase.co", "")}supabase.com/dashboard`,
              desc: "Manage tables, RLS, auth",
            },
            {
              label: "Stripe Dashboard",
              href: "https://dashboard.stripe.com",
              desc: "Payments, subscriptions",
            },
            {
              label: "Render Dashboard",
              href: "https://dashboard.render.com",
              desc: "API service logs & deploys",
            },
            {
              label: "Vercel Dashboard",
              href: "https://vercel.com/dashboard",
              desc: "Frontend deploys",
            },
            {
              label: "Resend Dashboard",
              href: "https://resend.com",
              desc: "Email logs & domain verification",
            },
          ].map(({ label, href, desc }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
              </div>
              <span className="text-zinc-600 group-hover:text-zinc-400 text-sm">
                →
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Grant admin note */}
      <div className="mt-6 p-4 rounded-xl bg-amber-950/30 border border-amber-900/50">
        <p className="text-sm font-medium text-amber-400 mb-1">
          Grant admin access to a user
        </p>
        <p className="text-xs text-amber-600 font-mono">
          UPDATE public.profiles SET is_admin = true WHERE email = &apos;email@example.com&apos;;
        </p>
        <p className="text-xs text-amber-700 mt-2">
          Run in Supabase SQL Editor → or use the Users page to toggle admin flag.
        </p>
      </div>
    </div>
  );
}
