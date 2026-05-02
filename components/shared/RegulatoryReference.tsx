import { cn } from "@/lib/utils";

// Amber-bordered blockquote — design system §4 reserves the sentinel color
// for regulatory references, so this component is the *only* place that
// border-l-sentinel appears outside the brand mark.

export function RegulatoryReference({
  law,
  article,
  jurisdiction,
  deadline,
  requirements,
  className,
}: {
  law: string;
  article?: string;
  jurisdiction?: string;
  deadline?: string;
  requirements?: string[];
  className?: string;
}) {
  return (
    <blockquote
      className={cn(
        "border-l-[3px] border-l-sentinel bg-surface-2 px-4 py-3 rounded-r-md",
        className,
      )}
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-mono text-[13px] font-semibold text-sentinel uppercase tracking-wider">
          {law}
        </span>
        {article && (
          <span className="font-mono text-mono-12 text-text-muted">{article}</span>
        )}
      </div>
      {jurisdiction && (
        <div className="font-mono text-[11px] text-text-dim mt-1 uppercase tracking-wider">
          {jurisdiction}
          {deadline && <span className="ml-2 text-text-muted">· {deadline}</span>}
        </div>
      )}
      {requirements && requirements.length > 0 && (
        <ul className="mt-2 text-body-em text-text space-y-1">
          {requirements.map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-sentinel mt-0.5">·</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </blockquote>
  );
}
