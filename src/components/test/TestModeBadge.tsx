/**
 * Floating TESTING MODE badge for test users
 * Displays a persistent badge at bottom-right corner
 */

"use client";

import { useTestMode } from "@/hooks/useTestMode";

export function TestModeBadge() {
  const { isTestMode, loading } = useTestMode();

  // Don't render during loading or for non-test users
  if (loading || !isTestMode) {
    return null;
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] px-5 py-3 shadow-lg animate-pulse hover:scale-105 transition-transform duration-300 cursor-pointer hover:animate-none"
      role="status"
      aria-label="Mode testing aktif"
    >
      <span className="text-sm font-bold uppercase tracking-wide text-[#78350f]">
        Testing Mode
      </span>
    </div>
  );
}
