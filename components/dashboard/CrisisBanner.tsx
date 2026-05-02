"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Full-width red strip that drops down from the top of the dashboard when the
// WS broadcasts CRISIS_TRIGGERED. The drop+overshoot uses Tailwind's
// `animate-drop-bounce`, the ambient red wash is on body via the
// `crisis-mode` class added by the page.

interface CrisisBannerProps {
  pattern: string;
  incidentCount: number;
  windowMinutes: number;
  triggeredAt: string;
  onDismiss?: () => void;
  className?: string;
}

function elapsed(triggered: string, now: number): string {
  const ms = Math.max(0, now - new Date(triggered).getTime());
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 1) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function CrisisBanner({
  pattern,
  incidentCount,
  windowMinutes,
  triggeredAt,
  onDismiss,
  className,
}: CrisisBannerProps) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "relative flex items-center gap-4 px-6 py-4 border-l-4 border-l-p1 rounded-md animate-drop-bounce animate-crisis-glow",
        className,
      )}
      style={{
        background:
          "linear-gradient(90deg, var(--crisis-bg) 0%, rgba(239, 68, 68, 0.25) 100%)",
      }}
    >
      <div className="w-10 h-10 rounded-md bg-[rgba(239,68,68,0.25)] flex items-center justify-center text-p1 animate-alarm-pulse shrink-0">
        <ShieldAlert className="w-5 h-5" strokeWidth={2.2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-mono text-[11px] text-p1 uppercase tracking-wider font-bold">
          Crise en cours
        </div>
        <div className="text-text font-semibold text-[15px]">
          <span className="tabular-nums">{incidentCount}</span> signalements
          similaires détectés ·{" "}
          <span className="text-p2">{pattern}</span>
        </div>
      </div>

      <div className="font-mono text-mono-12 text-text-muted text-right shrink-0">
        <div>
          Détectée il y a{" "}
          <span className="tabular-nums text-text font-semibold">
            {now === null ? "—" : elapsed(triggeredAt, now)}
          </span>
        </div>
        <div className="text-[10px] text-text-dim">
          Fenêtre {windowMinutes}min · SLA × 3
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-text-muted shrink-0 transition-colors"
          aria-label="Fermer la bannière de crise"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
