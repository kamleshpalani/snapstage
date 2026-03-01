"use client";

import { Zap } from "lucide-react";
import Link from "next/link";

interface CreditBannerProps {
  credits: number;
  /** Show the "1 credit will be used" warning for HD generation */
  showHdWarning?: boolean;
}

export default function CreditBanner({
  credits,
  showHdWarning = false,
}: CreditBannerProps) {
  if (showHdWarning) {
    return (
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
        <Zap className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-amber-800">
            1 credit will be used to generate HD
          </p>
          <p className="text-amber-700 mt-0.5">
            You have <strong>{credits}</strong> credit{credits !== 1 ? "s" : ""}{" "}
            remaining.
            {credits === 0 && (
              <>
                {" "}
                <Link
                  href="/dashboard/billing"
                  className="underline font-medium"
                >
                  Buy more credits →
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (credits === 0) {
    return (
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
        <Zap className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-800">
            You&apos;re out of credits
          </p>
          <p className="text-red-700 mt-0.5">
            Previews are free.{" "}
            <Link href="/dashboard/billing" className="underline font-medium">
              Buy a credit pack
            </Link>{" "}
            to download HD images.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Zap className="w-4 h-4 text-brand-500" />
      <span>
        <strong className="text-gray-700">{credits}</strong> credit
        {credits !== 1 ? "s" : ""} remaining
      </span>
    </div>
  );
}
