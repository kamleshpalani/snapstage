"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    // Clamp to [1, 99] to prevent division-by-zero in the before-clip style calc
    setPosition(Math.max(1, Math.min(99, (x / rect.width) * 100)));
  }, []);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      updatePosition(e.touches[0].clientX);
    },
    [updatePosition],
  );

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-2xl cursor-ew-resize shadow-xl"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      style={{ touchAction: "none" }}
    >
      {/* After image (full) */}
      <div className="relative aspect-[4/3]">
        <Image src={afterSrc} alt={afterLabel} fill className="object-cover" />
      </div>

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <div
          className="relative aspect-[4/3] w-full"
          style={{ width: `${100 / (position / 100)}%` }}
        >
          <Image
            src={beforeSrc}
            alt={beforeLabel}
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Divider line */}
      <div
        className="absolute inset-y-0 flex items-center"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        <div className="w-0.5 h-full bg-white shadow-lg" />
        {/* Handle */}
        <div
          className="absolute w-10 h-10 bg-white rounded-full shadow-xl border-2 border-gray-200 flex items-center justify-center cursor-ew-resize z-10"
          onMouseDown={handleMouseDown}
          onTouchStart={() => (isDragging.current = true)}
        >
          <svg
            className="w-5 h-5 text-gray-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M7 4l-4 6 4 6M13 4l4 6-4 6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3">
        <span className="bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
          {beforeLabel}
        </span>
      </div>
      <div className="absolute top-3 right-3">
        <span className="bg-brand-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {afterLabel} ✨
        </span>
      </div>
    </div>
  );
}
