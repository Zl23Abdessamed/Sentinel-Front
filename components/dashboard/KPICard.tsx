import { cn } from "@/lib/utils";

type KPIVariant = "default" | "critical" | "amber" | "success" | "vault" | "p2";

const valueColor: Record<KPIVariant, string> = {
  default: "text-text",
  critical: "text-p1",
  amber: "text-sentinel",
  success: "text-success",
  vault: "text-vault",
  p2: "text-p2",
};

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down" | "neutral"; text: string };
  icon?: React.ReactNode;
  variant?: KPIVariant;
  className?: string;
}

export function KPICard({
  label,
  value,
  trend,
  icon,
  variant = "default",
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-lg px-5 py-4 flex flex-col",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-mono-12 text-text-muted uppercase mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={cn(
          "font-mono text-[32px] font-bold leading-none tabular-nums",
          valueColor[variant],
        )}
      >
        {value}
      </div>
      {trend && (
        <div
          className={cn(
            "text-[11px] mt-2 font-mono",
            trend.direction === "up" && "text-success",
            trend.direction === "down" && "text-p1",
            trend.direction === "neutral" && "text-text-muted",
          )}
        >
          {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.text}
        </div>
      )}
    </div>
  );
}
