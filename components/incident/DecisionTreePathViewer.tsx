import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Renders the YAML decision-tree traversal stored in incident.decision_tree_path
// (a JSON array of strings) as a horizontal breadcrumb. The last node lights up
// in amber — that's the leaf the AI chose.

interface DecisionTreePathViewerProps {
  path: string[];
  className?: string;
}

export function DecisionTreePathViewer({
  path,
  className,
}: DecisionTreePathViewerProps) {
  if (path.length === 0) return null;
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-lg p-3 space-y-2",
        className,
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
        Arbre de décision · YAML déclaratif
      </div>
      <div className="flex items-center gap-1.5 flex-wrap text-[12px]">
        {path.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className={cn(
                "px-2 py-1 rounded-sm font-mono",
                i === path.length - 1
                  ? "bg-sentinel-dim text-sentinel font-semibold"
                  : "bg-surface-2 text-text-muted",
              )}
            >
              {step}
            </span>
            {i < path.length - 1 && (
              <ChevronRight
                className="w-3 h-3 text-text-dim shrink-0"
                strokeWidth={2}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
