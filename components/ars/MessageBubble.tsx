import { cn } from "@/lib/utils";
import { ArsAvatar } from "@/components/shared/ArsAvatar";

// Atomic chat unit. Variants render different content:
//   user-text   — user typed message
//   user-voice  — user voice note (caller renders the waveform inside)
//   ars-text    — plain ARS reply
//   ars-rich    — wider ARS bubble for transcription / AI result / smart prompts
//                 (children render full-width, no padding wrapper)

export type BubbleVariant = "user-text" | "user-voice" | "ars-text" | "ars-rich";

interface MessageBubbleProps {
  variant: BubbleVariant;
  timestamp?: string;
  children: React.ReactNode;
  className?: string;
  withAvatar?: boolean;
}

export function MessageBubble({
  variant,
  timestamp,
  children,
  className,
  withAvatar = true,
}: MessageBubbleProps) {
  const isUser = variant === "user-text" || variant === "user-voice";
  const isRich = variant === "ars-rich";
  return (
    <div
      className={cn(
        "flex gap-2 mb-2 animate-bubble-in",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && withAvatar && !isRich && (
        <div className="shrink-0 self-end">
          <ArsAvatar size={28} />
        </div>
      )}
      <div
        className={cn(
          "flex flex-col gap-1",
          isRich ? "w-full max-w-full" : "max-w-[80%]",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            variant === "user-text" &&
              "bg-surface-2 text-text px-3.5 py-2.5 rounded-[16px] rounded-br-sm text-body",
            variant === "user-voice" &&
              "bg-surface-2 text-text px-3.5 py-2.5 rounded-[16px] rounded-br-sm flex items-center gap-2",
            variant === "ars-text" &&
              "bg-surface text-text border border-border-soft px-3.5 py-2.5 rounded-[16px] rounded-bl-sm text-body",
            variant === "ars-rich" && "w-full",
            className,
          )}
        >
          {children}
        </div>
        {timestamp && (
          <div className="text-[11px] text-text-dim font-mono px-1">{timestamp}</div>
        )}
      </div>
    </div>
  );
}
