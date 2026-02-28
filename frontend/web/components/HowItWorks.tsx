const steps = [
  {
    number: "01",
    title: "Upload your room photo",
    description:
      "Take a photo of any empty or cluttered room. Upload it directly from your phone or computer. We support JPG, PNG, and WebP formats.",
    emoji: "📸",
  },
  {
    number: "02",
    title: "Choose your design style",
    description:
      "Select from 6+ curated interior styles — Modern, Scandinavian, Luxury, Coastal, Industrial, or Traditional. Customize to match the target buyer.",
    emoji: "🎨",
  },
  {
    number: "03",
    title: "Download your staged image",
    description:
      "Our AI generates a photorealistic staged version in under 90 seconds. Download in full resolution and use directly in your MLS listing.",
    emoji: "⬇️",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-gray-200">
            Simple process
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            3 steps to stunning listings
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            No design skills required. No software to install. Just upload,
            choose, and download.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-brand-200 to-transparent z-0 -translate-x-8" />
              )}

              <div className="card p-8 relative z-10 h-full">
                {/* Number */}
                <div className="text-5xl mb-4">{step.emoji}</div>
                <div className="inline-flex items-center justify-center w-8 h-8 bg-brand-600 text-white text-sm font-bold rounded-full mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="/signup"
            className="btn-primary gap-2 text-base py-4 px-8 inline-flex"
          >
            Try it free — no credit card needed
          </a>
        </div>
      </div>
    </section>
  );
}
