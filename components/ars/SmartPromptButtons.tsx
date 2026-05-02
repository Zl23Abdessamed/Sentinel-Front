"use client";

import { cn } from "@/lib/utils";

// Two big yes/no buttons. Used inside an ars-rich bubble when the AI flags
// `needs_clarification`. Pressing either calls back the answer; the page is
// responsible for re-running intake with the additional context.

interface SmartPromptButtonsProps {
  question: string;
  onAnswer: (answer: "oui" | "non") => void;
  className?: string;
  disabled?: boolean;
}

export function SmartPromptButtons({
  question,
  onAnswer,
  disabled,
  className,
}: SmartPromptButtonsProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border-soft rounded-lg p-3 space-y-3",
        className,
      )}
    >
      <div className="text-[13px] text-text">{question}</div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onAnswer("oui")}
          disabled={disabled}
          className="py-3 rounded-md border border-border-soft bg-surface-2 text-text font-mono text-[13px] uppercase tracking-wider hover:bg-sentinel-dim hover:border-sentinel hover:text-sentinel transition-colors disabled:opacity-40"
        >
          Oui
        </button>
        <button
          type="button"
          onClick={() => onAnswer("non")}
          disabled={disabled}
          className="py-3 rounded-md border border-border-soft bg-surface-2 text-text font-mono text-[13px] uppercase tracking-wider hover:bg-sentinel-dim hover:border-sentinel hover:text-sentinel transition-colors disabled:opacity-40"
        >
          Non
        </button>
      </div>
    </div>
  );
}
