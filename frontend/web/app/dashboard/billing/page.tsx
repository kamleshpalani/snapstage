import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: 3,
    features: [
      "3 stagings/month",
      "3 styles",
      "Standard quality",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    credits: 50,
    popular: true,
    features: [
      "50 stagings/month",
      "All 6 styles",
      "HD quality",
      "Priority support",
      "Download originals",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: 99,
    credits: 200,
    features: [
      "200 stagings/month",
      "All styles",
      "4K quality",
      "Dedicated support",
      "API access",
      "White-label",
    ],
  },
];

const TOPUP = [
  { credits: 5, price: 10, label: "Starter" },
  { credits: 15, price: 25, label: "Value" },
  { credits: 40, price: 60, label: "Pro Pack" },
];

export default async function BillingPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining, plan")
    .eq("id", user.id)
    .single();

  const currentPlan = profile?.plan ?? "free";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        Billing & Credits
      </h1>
      <p className="text-slate-500 text-sm mb-8">
        Manage your subscription and credits.
      </p>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-6 text-white mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-brand-200 text-sm font-medium mb-1">
            Current Plan
          </p>
          <p className="text-3xl font-extrabold capitalize">{currentPlan}</p>
        </div>
        <div className="bg-white/20 rounded-xl px-5 py-3 text-center">
          <p className="text-2xl font-extrabold">
            {profile?.credits_remaining ?? 0}
          </p>
          <p className="text-brand-100 text-xs font-semibold mt-0.5">
            Credits Remaining
          </p>
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-lg font-bold text-slate-800 mb-4">Choose a Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`card relative flex flex-col ${plan.popular ? "ring-2 ring-brand-500" : ""}`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
            )}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-400">
                  {plan.credits} credits/mo
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-slate-900">
                  ${plan.price}
                </span>
                <span className="text-slate-400 text-sm">/mo</span>
              </div>
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <span className="text-green-500">✓</span> {f}
                </li>
              ))}
            </ul>
            {currentPlan === plan.id ? (
              <div className="text-center py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold">
                Current Plan
              </div>
            ) : (
              <form action="/api/billing/checkout" method="POST">
                <input type="hidden" name="planId" value={plan.id} />
                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    plan.popular
                      ? "bg-brand-600 hover:bg-brand-700 text-white"
                      : "border-2 border-brand-500 text-brand-600 hover:bg-brand-50"
                  }`}
                >
                  {plan.price === 0 ? "Downgrade" : `Upgrade to ${plan.name}`}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      {/* Top-up Credits */}
      <h2 className="text-lg font-bold text-slate-800 mb-4">
        Buy Extra Credits
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {TOPUP.map((pack, i) => (
          <form key={i} action="/api/billing/topup" method="POST">
            <input type="hidden" name="credits" value={pack.credits} />
            <button
              type="submit"
              className="card card-hover w-full text-center group"
            >
              <p className="text-3xl font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">
                {pack.credits}
              </p>
              <p className="text-sm text-slate-400 mt-1 mb-3">{pack.label}</p>
              <p className="text-brand-600 font-bold text-lg">${pack.price}</p>
            </button>
          </form>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400">
        Payments are processed securely by Stripe. Credits never expire on paid
        plans.{" "}
        <Link
          href="/dashboard/settings"
          className="underline hover:text-slate-600"
        >
          Manage your account
        </Link>
      </p>
    </div>
  );
}
