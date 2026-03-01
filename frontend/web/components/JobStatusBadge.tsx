"use client";

type Status =
  | "queued"
  | "preview_generating"
  | "preview_ready"
  | "approved"
  | "hd_generating"
  | "hd_ready"
  | "failed";

const CONFIG: Record<
  Status,
  { label: string; color: string; dot: string; pulse: boolean }
> = {
  queued: {
    label: "Queued",
    color: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
    pulse: false,
  },
  preview_generating: {
    label: "Generating Preview",
    color: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    pulse: true,
  },
  preview_ready: {
    label: "Preview Ready",
    color: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    pulse: false,
  },
  approved: {
    label: "Approved ✓",
    color: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    pulse: false,
  },
  hd_generating: {
    label: "Generating HD",
    color: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
    pulse: true,
  },
  hd_ready: {
    label: "HD Ready ⚡",
    color: "bg-brand-100 text-brand-700",
    dot: "bg-brand-500",
    pulse: false,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-600",
    dot: "bg-red-500",
    pulse: false,
  },
};

interface JobStatusBadgeProps {
  status: Status;
  className?: string;
}

export default function JobStatusBadge({
  status,
  className = "",
}: Readonly<JobStatusBadgeProps>) {
  const cfg = CONFIG[status as Status] ?? {
    label: status,
    color: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
    pulse: false,
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.color} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.dot}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`}
        />
      </span>
      {cfg.label}
    </span>
  );
}
