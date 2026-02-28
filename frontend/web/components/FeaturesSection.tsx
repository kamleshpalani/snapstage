import {
  Zap,
  Palette,
  ImageIcon,
  Download,
  SlidersHorizontal,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Get professionally staged images in under 90 seconds. No waiting days for physical staging.",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    icon: Palette,
    title: "6+ Design Styles",
    description:
      "Modern, Scandinavian, Luxury, Coastal, Industrial, Traditional — pick the perfect look.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    icon: ImageIcon,
    title: "Photorealistic Results",
    description:
      "AI-generated staging that looks real enough to fool buyers. High-res, print-ready output.",
    color: "text-brand-500",
    bg: "bg-brand-50",
  },
  {
    icon: Download,
    title: "Instant Download",
    description:
      "Download your staged images in full resolution immediately. Ready for MLS listings.",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    icon: SlidersHorizontal,
    title: "Before/After Comparison",
    description:
      "Impress clients with a side-by-side slider showing the transformation.",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    icon: Users,
    title: "Team & Agency Plans",
    description:
      "Collaborate with your team, manage multiple listings, and white-label the results.",
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            Everything you need
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why agents love SnapStage
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Save thousands on physical staging. Win more listings with stunning
            visuals.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="card-hover p-6">
              <div
                className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
