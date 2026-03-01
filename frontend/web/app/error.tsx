"use client";

import { useEffect } from "react";

// Catches client-side errors at the root segment (e.g. ChunkLoadError during
// client-side navigation after a new deployment).
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isChunkError(error)) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm px-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          An unexpected error occurred. Try refreshing the page.
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          Try again
        </button>
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
