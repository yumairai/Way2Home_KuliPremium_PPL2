"use client";

import { useEffect, useState } from "react";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function compute(deadlineAt: string): Remaining {
  const diff = new Date(deadlineAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
    expired: false,
  };
}

export function useCountdown(deadlineAt?: string) {
  const [remaining, setRemaining] = useState<Remaining>(() =>
    deadlineAt ? compute(deadlineAt) : { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true },
  );

  useEffect(() => {
    if (!deadlineAt) return;
    const tick = () => setRemaining(compute(deadlineAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadlineAt]);

  return remaining;
}

export function formatRemaining(remaining: Remaining) {
  if (remaining.expired) return "Waktu habis";
  const { days, hours, minutes } = remaining;
  if (days > 0) return `${days} hari ${hours} jam tersisa`;
  if (hours > 0) return `${hours} jam ${minutes} menit tersisa`;
  if (minutes > 0) return `${minutes} menit ${remaining.seconds} detik tersisa`;
  return `${remaining.seconds} detik tersisa`;
}
