"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// 72-hour CNDP-notification countdown. Per design system §4.5: amber default,
// red border AND pulsing background when remaining < 24h. After expiry,
// "DÉLAI EXPIRÉ" replaces the timer and the card pulses red.

interface Loi1807CounterProps {
  triggeredAt: string;
  deadlineAt?: string | null;
  notified?: boolean;
  className?: string;
}

function format(remainingMs: number): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function Loi1807Counter({
  triggeredAt,
  deadlineAt,
  notified,
  className,
}: Loi1807CounterProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const deadline = deadlineAt
    ? new Date(deadlineAt).getTime()
    : new Date(triggeredAt).getTime() + 72 * 3600 * 1000;

  if (now === null) {
    return (
      <div
        className={cn(
          "bg-surface border-l-[3px] border-l-sentinel border border-border rounded-r-md p-3",
          className,
        )}
      >
        <div className="font-mono text-[11px] text-sentinel uppercase tracking-wider mb-1">
          Loi 18-07 Art. 38 · CNDP 72h
        </div>
        <div className="font-mono text-[18px] font-bold text-text-dim tabular-nums">
          --h --m --s
        </div>
      </div>
    );
  }

  const remaining = deadline - now;
  const expired = remaining <= 0;
  const hoursLeft = Math.floor(remaining / 3_600_000);
  const critical = !expired && hoursLeft < 24;

  return (
    <div
      className={cn(
        "border-l-[3px] border border-border rounded-r-md p-3 transition-colors",
        notified
          ? "bg-[rgba(16,185,129,0.05)] border-l-success"
          : expired
            ? "bg-[rgba(239,68,68,0.1)] border-l-p1 animate-sla-pulse"
            : critical
              ? "bg-[rgba(239,68,68,0.05)] border-l-p1"
              : "bg-surface border-l-sentinel",
        className,
      )}
    >
      <div
        className={cn(
          "font-mono text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5",
          notified
            ? "text-success"
            : critical || expired
              ? "text-p1"
              : "text-sentinel",
        )}
      >
        <Clock className="w-3 h-3" strokeWidth={2.2} />
        {notified
          ? "CNDP notifiée · Loi 18-07 Art. 38"
          : "Loi 18-07 Art. 38 · CNDP sous 72h"}
      </div>
      <div
        className={cn(
          "font-mono text-[18px] font-bold tabular-nums",
          notified
            ? "text-success"
            : expired || critical
              ? "text-p1"
              : "text-text",
        )}
      >
        {expired ? "DÉLAI EXPIRÉ" : format(remaining)}
      </div>
      {!notified && !expired && (
        <div className="text-[11px] text-text-muted mt-1">
          Décret 26-07 · Coordination ASSI requise pour les institutions
          publiques.
        </div>
      )}
    </div>
  );
}
