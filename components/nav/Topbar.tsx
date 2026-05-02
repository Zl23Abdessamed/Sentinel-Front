import { Search, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// Page-level top strip: H1 title + mono subtitle on left; search + lang
// switch + notifications + settings on right. The lang switch is decorative
// for now (UI is FR-only until step 13).

interface TopbarProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function Topbar({ title, subtitle, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "h-15 px-6 py-3 border-b border-border bg-bg/80 backdrop-blur-sm flex items-center justify-between gap-4 sticky top-0 z-20",
        className,
      )}
    >
      <div className="flex flex-col min-w-0">
        <h1 className="text-h1 truncate">{title}</h1>
        {subtitle && (
          <div className="font-mono text-mono-12 text-text-muted truncate">
            {subtitle}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative w-9 h-9 rounded-md border border-border bg-surface hover:bg-surface-hover flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-text-muted" strokeWidth={2} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-p1 animate-pulse-dot" />
        </button>

        <button
          className="w-9 h-9 rounded-md border border-border bg-surface hover:bg-surface-hover flex items-center justify-center"
          aria-label="Paramètres"
        >
          <Settings className="w-4 h-4 text-text-muted" strokeWidth={2} />
        </button>

      </div>
    </header>
  );
}
