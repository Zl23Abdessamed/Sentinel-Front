import { cn } from "@/lib/utils";

// Three-dot placeholder used by the transcription panels (empty + streaming
// states) and any other "waiting for content" slot. Animated when streaming.

export function PlaceholderDots({
  streaming = false,
  size = "md",
  className,
}: {
  streaming?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const dot =
    size === "sm"
      ? "w-1 h-1"
      : "w-1.5 h-1.5";
  return (
    <span
      className={cn("inline-flex gap-1.5 items-center", className)}
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "inline-block rounded-full bg-text-dim",
            dot,
            streaming && "animate-pulse-dot",
          )}
          style={streaming ? { animationDelay: `${i * 180}ms` } : undefined}
        />
      ))}
    </span>
  );
}
