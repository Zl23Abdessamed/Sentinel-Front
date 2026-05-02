"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  /** ISO timestamp when the countdown began (typically incident.created_at). */
  startedAt: string;
  /** Total SLA window in minutes from startedAt to expiry. */
  slaMinutes: number;
  /** Render with a "× 3" suffix to signal Crisis Mode compression. */
  compressed?: boolean;
  /** "long" includes hours when relevant, "compact" hides them under 1h. */
  format?: "compact" | "long";
  className?: string;
}

function formatRemaining(ms: number, format: "compact" | "long"): string {
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (format === "long" || h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

export function CountdownTimer({
  startedAt,
  slaMinutes,
  compressed = false,
  format = "compact",
  className,
}: CountdownTimerProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Render an inert placeholder during SSR / pre-hydration so the server and
  // client output match exactly (no hydration mismatch warning).
  if (now === null) {
    return (
      <span
        className={cn(
          "font-mono text-[14px] font-semibold tabular-nums text-text-dim",
          className,
        )}
      >
        --:--
      </span>
    );
  }

  const start = new Date(startedAt).getTime();
  const totalMs = slaMinutes * 60_000;
  const remaining = totalMs - (now - start);
  const pct = totalMs > 0 ? Math.max(0, remaining / totalMs) : 0;

  // Color thresholds — design system §4.5
  let color = "text-p4";
  let pulse = false;
  if (remaining <= 0) {
    color = "text-p1";
    pulse = true;
  } else if (pct < 0.25) {
    color = "text-p2";
  } else if (pct < 0.5) {
    color = "text-p3";
  }

  const display = remaining <= 0 ? "EXPIRÉ" : formatRemaining(remaining, format);

  return (
    <span
      className={cn(
        "font-mono text-[14px] font-semibold tabular-nums inline-flex items-baseline gap-1",
        color,
        pulse && "animate-sla-pulse",
        className,
      )}
      aria-live="off"
    >
      {display}
      {compressed && <span className="text-[10px] opacity-70 font-normal">× 3</span>}
    </span>
  );
}
