import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out SnapStage",
    credits: "3 stagings",
    cta: "Get started",
    ctaHref: "/signup",
    ctaStyle: "btn-secondary",
    highlighted: false,
    features: [
      "3 AI stagings per month",
      "6 design styles",
      "Standard resolution",
      "JPEG download",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For active real estate agents",
    credits: "50 stagings/mo",
    cta: "Start Pro",
    ctaHref: "/signup?plan=pro",
    ctaStyle: "btn-primary",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "50 AI stagings per month",
      "6 design styles",
      "High resolution (4K)",
      "PNG + JPEG download",
      "Before/after slider",
      "Priority processing",
      "Chat support",
    ],
  },
  {
    name: "Agency",
    price: "$99",
    period: "per month",
    description: "For teams and agencies",
    credits: "Unlimited stagings",
    cta: "Start Agency",
    ctaHref: "/signup?plan=agency",
    ctaStyle: "btn-secondary",
    highlighted: false,
    features: [
      "Unlimited AI stagings",
      "All design styles",
      "Ultra-high resolution",
      "Bulk upload (up to 20)",
      "Team collaboration (5 seats)",
      "White-label exports",
      "API access",
      "Dedicated support",
    ],
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            💰 Save 10x vs. physical staging
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Physical staging costs $1,000–$5,000. SnapStage costs a fraction of
            that with better results.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
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
                  <span className="text-gray-500 pb-1">/{plan.period}</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">{plan.description}</p>
                <div className="mt-3 inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  ⚡ {plan.credits}
                </div>
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

        {/* Pay as you go */}
        <div className="mt-10 text-center card p-6 max-w-md mx-auto bg-gray-50">
          <p className="text-gray-700 font-medium mb-1">
            💳 Pay as you go — <strong>$2 per staging</strong>
          </p>
          <p className="text-sm text-gray-500">
            No subscription. Buy credits when you need them.
          </p>
          <Link
            href="/signup?plan=payg"
            className="text-sm text-brand-600 hover:underline mt-2 inline-block font-medium"
          >
            Buy credits →
          </Link>
        </div>
      </div>
    </section>
  );
}
