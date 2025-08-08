"use client";
import { useEffect, useState } from "react";

export function useCountdown(target: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return { seconds: 0, done: true };
  const diffMs = target * 1000 - now;
  return { seconds: Math.max(0, Math.floor(diffMs / 1000)), done: diffMs <= 0 };
}

export function Countdown({ target, label }: { target: number; label: string }) {
  const { seconds, done } = useCountdown(target);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return <span className={`text-sm ${done ? 'text-red-500' : 'text-green-600'}`}>{label}: {m}:{s.toString().padStart(2,'0')}</span>;
}
