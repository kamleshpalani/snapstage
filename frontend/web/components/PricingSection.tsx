import Link from "next/link";
import { Check, Shield, Zap, RefreshCw } from "lucide-react";

const packs = [
  {
    name: "Starter",
    price: "$14",
    images: 20,
    perImage: "$0.70",
    description: "Try it out, no commitment",
    cta: "Buy Starter Pack",
    ctaHref: "/signup?plan=starter",
    ctaStyle: "btn-secondary",
    highlighted: false,
    features: [
      "20 AI stagings",
      "12+ design styles",
      "Renovation & declutter mode",
      "4K resolution output",
      "PNG + JPEG download",
      "Before/after slider",
      "Commercial license ✅",
      "Credits never expire",
    ],
  },
  {
    name: "Growth",
    price: "$29",
    images: 100,
    perImage: "$0.29",
    description: "Most popular with active agents",
    cta: "Buy Growth Pack",
    ctaHref: "/signup?plan=growth",
    ctaStyle: "btn-primary",
    highlighted: true,
    badge: "Best Value",
    features: [
      "100 AI stagings",
      "12+ design styles",
      "Renovation & declutter mode",
      "4K resolution output",
      "PNG + JPEG download",
      "Before/after slider",
      "Priority processing",
      "Commercial license ✅",
      "Credits never expire",
      "Chat support",
    ],
  },
  {
    name: "Agency",
    price: "$55",
    images: 250,
    perImage: "$0.22",
    description: "For teams & brokerages",
    cta: "Buy Agency Pack",
    ctaHref: "/signup?plan=agency",
    ctaStyle: "btn-secondary",
    highlighted: false,
    features: [
      "250 AI stagings",
      "12+ design styles",
      "Renovation & declutter mode",
      "4K resolution output",
      "Bulk upload (up to 20)",
      "Team seats (5 members)",
      "White-label exports",
      "Commercial license ✅",
      "Credits never expire",
      "Priority support",
    ],
  },
];

const comparison = [
  {
    method: "Physical Staging",
    cost: "$500–$5,000",
    time: "1–3 days",
    highlight: false,
  },
  {
    method: "Traditional Virtual Staging",
    cost: "$20–$100/room",
    time: "24–48 hours",
    highlight: false,
  },
  {
    method: "Other AI Tools",
    cost: "$1–$5/room",
    time: "1–5 minutes",
    highlight: false,
  },
  {
    method: "SnapStage",
    cost: "$0.22–$0.70/room",
    time: "~30 seconds",
    highlight: true,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            💰 90% cheaper than traditional staging
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pay once. Credits never expire. No subscriptions, no surprises.
          </p>
        </div>

        {/* Promo + free trial banner */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 px-4 py-2 rounded-full text-sm font-semibold">
            🎉 20% OFF launch code:{" "}
            <span className="font-bold font-mono tracking-wider">SNAP20</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
            🚀 Try 3 images free — no credit card needed
          </div>
        </div>

        {/* Packs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {packs.map((plan) => (
            <div
              key={plan.name}
              className={`card p-8 flex flex-col relative ${
                plan.highlighted ? "ring-2 ring-brand-500 shadow-xl" : ""
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 pb-1 ml-1">one-time</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-500">
                    {plan.images} images
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-sm font-semibold text-green-600">
                    {plan.perImage}/image
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-gray-700"
                  >
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`${plan.ctaStyle} w-full text-center`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Trust badges row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Commercial license included</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-500" />
            <span>Credits never expire</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <span>Love it or we re-render free</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🔒</span>
            <span>Secure checkout via Stripe</span>
          </div>
        </div>

        {/* Satisfaction guarantee */}
        <div className="mt-8 max-w-2xl mx-auto text-center bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="text-3xl mb-2">💚</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Satisfaction Guaranteed
          </h3>
          <p className="text-gray-600 text-sm">
            Not happy with a result? We&apos;ll re-render it free — no questions
            asked. We&apos;re confident in our quality because our customers
            are.
          </p>
        </div>

        {/* Cost comparison table */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            See how SnapStage compares
          </h3>
          <div className="max-w-3xl mx-auto overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">
                    Method
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">
                    Cost per room
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">
                    Delivery time
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr
                    key={row.method}
                    className={`border-b border-gray-100 last:border-0 ${
                      row.highlight ? "bg-brand-50" : "bg-white"
                    }`}
                  >
                    <td
                      className={`px-6 py-4 font-medium ${
                        row.highlight ? "text-brand-700" : "text-gray-800"
                      }`}
                    >
                      {row.highlight && "⚡ "}
                      {row.method}
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        row.highlight
                          ? "text-brand-700 font-bold"
                          : "text-gray-600"
                      }`}
                    >
                      {row.cost}
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        row.highlight
                          ? "text-brand-700 font-bold"
                          : "text-gray-600"
                      }`}
                    >
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
            Need more images?{" "}
            <Link
              href="/contact"
              className="text-brand-600 hover:underline font-medium"
            >
              Contact us for custom enterprise pricing →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
