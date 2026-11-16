"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  const [exitingToastId, setExitingToastId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;

    const duration = toast.duration ?? 3000;
    let dismissTimer: ReturnType<typeof setTimeout> | null = null;

    const hideTimer = setTimeout(() => {
      setExitingToastId(toast.id);
      dismissTimer = setTimeout(onDismiss, 300); // Wait for fade out animation
    }, duration);

    return () => {
      clearTimeout(hideTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isVisible = exitingToastId !== toast.id;

  const styles = {
    success: {
      bg: "bg-[#ecfdf5]",
      border: "border-[#a7f3d0]",
      text: "text-[#065f46]",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    error: {
      bg: "bg-[#fef2f2]",
      border: "border-[#fecaca]",
      text: "text-[#991b1b]",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      ),
    },
    info: {
      bg: "bg-[#eef5ff]",
      border: "border-[#8fb9ed]",
      text: "text-[#004796]",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      ),
    },
  };

  const style = styles[toast.type];

  return (
    <div
      className={`fixed left-1/2 top-24 z-50 -translate-x-1/2 transform transition-all duration-400 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-2 pointer-events-none opacity-0"
      }`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border ${style.bg} ${style.border} ${style.text} px-6 py-4 shadow-xl`}
      >
        <div className="shrink-0">{style.icon}</div>
        <p className="text-sm font-semibold">{toast.message}</p>
      </div>
    </div>
  );
}
