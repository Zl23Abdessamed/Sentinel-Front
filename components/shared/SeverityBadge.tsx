import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/api";

export type SeverityLevel = Severity | "WHISPER";

const styles: Record<SeverityLevel, string> = {
  P1: "bg-[rgba(239,68,68,0.15)] text-p1 border-l-p1",
  P2: "bg-[rgba(249,115,22,0.15)] text-p2 border-l-p2",
  P3: "bg-[rgba(234,179,8,0.15)] text-p3 border-l-p3",
  P4: "bg-[rgba(59,130,246,0.15)] text-p4 border-l-p4",
  WHISPER: "bg-[rgba(139,92,246,0.15)] text-whisper border-l-whisper",
};

const labels: Record<SeverityLevel, string> = {
  P1: "P1 CRITIQUE",
  P2: "P2 ÉLEVÉE",
  P3: "P3 MOYENNE",
  P4: "P4 FAIBLE",
  WHISPER: "MURMURE",
};

export function SeverityBadge({
  level,
  compact = false,
  className,
}: {
  level: SeverityLevel;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] px-2 py-1 rounded-sm border-l-2",
        styles[level],
        className,
      )}
      aria-label={`Sévérité ${labels[level]}`}
    >
      {compact ? level : labels[level]}
    </span>
  );
}
