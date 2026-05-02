import { Check, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// Pill summarising chain integrity. Green when ok, red when not. Used in the
// page Topbar slot AND inside the export panel after verify is clicked.

interface ChainIntegrityBadgeProps {
  ok: boolean;
  eventCount: number;
  className?: string;
}

export function ChainIntegrityBadge({
  ok,
  eventCount,
  className,
}: ChainIntegrityBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border font-mono text-mono-12 uppercase tracking-wider",
        ok
          ? "bg-[rgba(16,185,129,0.1)] border-success text-success"
          : "bg-[rgba(239,68,68,0.1)] border-p1 text-p1",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {ok ? (
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
      ) : (
        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
      )}
      <Shield className="w-3.5 h-3.5" strokeWidth={2} />
      <span>
        {ok ? "Chaîne SHA-256 intègre" : "Intégrité compromise"}
        <span className="ml-2 text-text-muted normal-case">
          · {eventCount} événements
        </span>
      </span>
    </div>
  );
}
