"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Top-of-screen pill on /intake. Counts DOWN from openedAt for durationMinutes.
// Color logic per design system §4.14:
//   > 5 min        — amber (default)
//   1–5 min        — orange
//   < 1 min        — red + pulse
//   expired        — component returns null (don't show "EXPIRÉ" — feels punitive)

const TOOLTIP =
  "Si tu signales dans ce délai, aucune mesure disciplinaire ne sera prise. C'est ta protection.";

interface DelaiDeGraceTimerProps {
  openedAt: string;
  durationMinutes?: number;
  className?: string;
}

export function DelaiDeGraceTimer({
  openedAt,
  durationMinutes = 10,
  className,
}: DelaiDeGraceTimerProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;

  const start = new Date(openedAt).getTime();
  const total = durationMinutes * 60_000;
  const remaining = Math.max(0, start + total - now);

  if (remaining <= 0) return null;

  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const display = `${minutes} min ${String(seconds).padStart(2, "0")} sec`;

  let style = "bg-sentinel-dim border-sentinel text-sentinel";
  let pulse = false;
  if (remaining < 60_000) {
    style = "bg-[rgba(239,68,68,0.15)] border-p1 text-p1";
    pulse = true;
  } else if (remaining < 5 * 60_000) {
    style = "bg-[rgba(249,115,22,0.15)] border-p2 text-p2";
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-md border text-mono-12",
        style,
        pulse && "animate-sla-pulse",
        className,
      )}
      title={TOOLTIP}
      aria-label={`Délai de grâce : ${display}. ${TOOLTIP}`}
    >
      <Clock className="w-3.5 h-3.5" strokeWidth={2} />
      <span>
        Délai de grâce :{" "}
        <span className="tabular-nums font-semibold">{display}</span>
      </span>
    </div>
  );
}
