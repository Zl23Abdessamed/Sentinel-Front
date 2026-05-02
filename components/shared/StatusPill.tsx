import { cn } from "@/lib/utils";
import type { IncidentStatus } from "@/lib/api";

const variants: Record<IncidentStatus, { class: string; label: string; pulse: boolean }> = {
  ACTIVE:      { class: "bg-[rgba(249,115,22,0.15)] text-p2 border-l-p2",                 label: "ACTIF",     pulse: true  },
  IN_PROGRESS: { class: "bg-[rgba(234,179,8,0.15)] text-p3 border-l-p3",                  label: "EN COURS",  pulse: false },
  RESOLVED:    { class: "bg-[rgba(16,185,129,0.15)] text-success border-l-success",       label: "RÉSOLU",    pulse: false },
  ESCALATED:   { class: "bg-[rgba(239,68,68,0.15)] text-p1 border-l-p1",                  label: "ESCALADÉ",  pulse: true  },
  ARCHIVED:    { class: "bg-[rgba(100,116,139,0.15)] text-neutral border-l-neutral",      label: "ARCHIVÉ",   pulse: false },
};

export function StatusPill({
  status,
  withDot = true,
  className,
}: {
  status: IncidentStatus;
  withDot?: boolean;
  className?: string;
}) {
  const v = variants[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] px-2 py-1 rounded-sm border-l-2",
        v.class,
        className,
      )}
      aria-label={`Statut ${v.label}`}
    >
      {withDot && (
        <span
          className={cn(
            "inline-block w-1.5 h-1.5 rounded-full bg-current",
            v.pulse && "animate-pulse-dot",
          )}
        />
      )}
      {v.label}
    </span>
  );
}
