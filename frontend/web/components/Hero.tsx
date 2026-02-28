import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 pb-20 overflow-hidden bg-gradient-to-br from-brand-50 via-white to-purple-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-brand-500" />
              AI-powered virtual staging
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Stage any room <span className="gradient-text">in seconds</span>{" "}
              with AI
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Upload an empty room photo and watch AI transform it into a
              beautifully staged space. Perfect for real estate agents,
              developers & homeowners.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Link
                href="/signup"
                className="btn-primary gap-2 text-base py-4 px-8"
              >
                Start staging for free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="btn-secondary text-base py-4 px-8"
              >
                See how it works
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </span>
                <span>4.9/5 from 2,000+ users</span>
              </div>
              <span className="hidden sm:block text-gray-300">•</span>
              <span>No credit card required</span>
              <span className="hidden sm:block text-gray-300">•</span>
              <span>3 free stagings</span>
            </div>
          </div>

          {/* Right: Before/After Preview */}
          <div className="relative">
            <div className="card overflow-hidden shadow-2xl rounded-3xl">
              {/* Mock before/after UI */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
                {/* Staged room mockup */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="aspect-square bg-gray-300 rounded-xl flex items-center justify-center text-4xl">
                        🪑
                      </div>
                      <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center text-4xl">
                        🛋️
                      </div>
                      <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center text-4xl">
                        🌿
                      </div>
                      <div className="aspect-square bg-gray-300 rounded-xl flex items-center justify-center text-4xl">
                        🖼️
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">
                      AI-staged living room
                    </p>
                  </div>
                </div>

                {/* Overlay badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                  Before
                </div>
                <div className="absolute top-4 right-4 bg-brand-600 text-white rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm">
                  After ✨
                </div>
              </div>

              {/* Style selector strip */}
              <div className="bg-white px-4 py-3 flex items-center gap-2 overflow-x-auto">
                {[
                  "Modern 🏙️",
                  "Luxury ✨",
                  "Coastal 🌊",
                  "Scandinavian 🌿",
                ].map((s) => (
                  <span
                    key={s}
                    className="whitespace-nowrap text-xs bg-gray-100 hover:bg-brand-50 hover:text-brand-700 px-3 py-1.5 rounded-full cursor-pointer transition-colors font-medium text-gray-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Floating stats */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-4 py-3 shadow-lg border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">
                ⚡ Generated in
              </p>
              <p className="text-xl font-bold text-gray-900">47 seconds</p>
            </div>
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-3 shadow-lg border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">🌍 Used in</p>
              <p className="text-xl font-bold text-gray-900">50+ countries</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
