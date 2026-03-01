"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    if (isChunkError(error)) {
      globalThis.location.reload();
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Something went wrong
      </h2>
      <p className="text-gray-500 text-sm text-center max-w-xs">
        {isChunkError(error)
          ? "The app was updated — reloading to get the latest version…"
          : "An unexpected error occurred."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

function isChunkError(err: Error) {
  return (
    err.name === "ChunkLoadError" ||
    err.message?.includes("ChunkLoadError") ||
    err.message?.includes("Loading chunk") ||
    err.message?.includes("Chunk not found") ||
    err.message?.includes("Failed to fetch dynamically imported module")
  );
}
