"use client";

import { cn } from "@/lib/utils";
import type { Incident } from "@/lib/api";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusPill } from "@/components/shared/StatusPill";
import { CountdownTimer } from "@/components/shared/CountdownTimer";

// 7-column row matching the dashboard mockup. The "selected" state lights the
// row up with the brand amber left border + sentinel-dim background. Crisis
// rows get a red left border that takes priority over selection.

interface IncidentRowProps {
  incident: Incident;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "à l'instant";
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export function IncidentRow({
  incident,
  selected,
  onClick,
  className,
}: IncidentRowProps) {
  const isCrisis = incident.mode === "CRISIS";
  const closed = incident.status === "RESOLVED" || incident.status === "ARCHIVED";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "grid grid-cols-[110px_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3 border border-border rounded-md bg-surface cursor-pointer transition-colors",
        selected && !isCrisis && "bg-sentinel-dim border-l-[3px] border-l-sentinel",
        !selected && !isCrisis && "hover:bg-surface-hover hover:border-border-soft",
        isCrisis && "border-l-[3px] border-l-p1 bg-[rgba(239,68,68,0.06)]",
        isCrisis && selected && "ring-1 ring-p1/40",
        className,
      )}
      aria-pressed={selected}
    >
      <div className="font-mono text-[12px] text-sentinel font-semibold tracking-wider">
        {incident.id}
      </div>

      <div className="min-w-0">
        <div className="text-[13px] text-text font-medium truncate">
          {incident.title_fr}
        </div>
        <div className="text-[11px] text-text-muted truncate">
          {incident.matched_campaign && (
            <>
              <span className="text-sentinel">{incident.matched_campaign}</span>
              <span className="mx-1.5">·</span>
            </>
          )}
          {timeAgo(incident.created_at)}
        </div>
      </div>

      <SeverityBadge level={incident.severity} compact />

      <div className="min-w-[70px] text-right">
        {closed ? (
          <span className="font-mono text-[11px] text-text-dim">—</span>
        ) : (
          <CountdownTimer
            startedAt={incident.created_at}
            slaMinutes={incident.sla_minutes}
            compressed={isCrisis}
          />
        )}
      </div>

      <StatusPill status={incident.status} />

      <span className="font-mono text-[10px] text-text-dim hidden lg:block">
        {incident.channel}
      </span>
    </div>
  );
}
