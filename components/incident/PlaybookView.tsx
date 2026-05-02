import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Inline playbook renderer. Each step shows a numbered chip → step text →
// role + SLA chip. Done steps strike through and the chip flips to green.

interface WorkflowStep {
  step_fr: string;
  role: string;
  sla_minutes: number;
  done?: boolean;
  automation?: string;
}

interface PlaybookViewProps {
  playbookId: string;
  steps: WorkflowStep[];
  className?: string;
}

export function PlaybookView({
  playbookId,
  steps,
  className,
}: PlaybookViewProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-lg p-4 space-y-3",
        className,
      )}
    >
      <header className="flex items-center justify-between">
        <div className="font-mono text-mono-12 uppercase tracking-wider text-text-muted">
          Playbook · YAML
        </div>
        <div className="font-mono text-[12px] text-sentinel font-semibold tracking-wider">
          {playbookId || "—"}
        </div>
      </header>
      {steps.length === 0 ? (
        <div className="text-[12px] text-text-dim italic py-2">
          Aucune étape définie pour ce playbook.
        </div>
      ) : (
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5 font-semibold",
                  s.done
                    ? "bg-success border-success text-white"
                    : "border-border-soft text-text-dim",
                )}
              >
                {s.done ? (
                  <Check className="w-3 h-3" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "text-[13px]",
                    s.done ? "line-through text-text-dim" : "text-text",
                  )}
                >
                  {s.step_fr}
                </div>
                <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider mt-0.5">
                  <span className="text-text-muted">{s.role}</span> ·{" "}
                  <span>{s.sla_minutes}min</span>
                  {s.automation && (
                    <span className="ml-2 text-classifier">
                      · auto: {s.automation}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
