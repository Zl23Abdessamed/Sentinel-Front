"use client";

import { useEffect, useState } from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaceholderDots } from "@/components/shared/PlaceholderDots";

// THE WOW. Three columns: Darija (mono Latin) | Français (sans) | العربية (RTL).
// The caller drives `stage` so it can sequence with backend events; each panel
// streams its target text character-by-character using a simple interval.

export type TranscriptionStage =
  | "empty"
  | "darija-streaming"
  | "fr-streaming"
  | "ar-streaming"
  | "complete";

interface ThreeColumnTranscriptionProps {
  darijaTarget: string;
  frTarget: string;
  arTarget: string;
  stage: TranscriptionStage;
  className?: string;
}

function useStreamedText(target: string, active: boolean, charDelayMs: number) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!active) {
      setText("");
      return;
    }
    let i = 0;
    setText("");
    const id = setInterval(() => {
      i += 1;
      setText(target.slice(0, i));
      if (i >= target.length) clearInterval(id);
    }, charDelayMs);
    return () => clearInterval(id);
  }, [active, target, charDelayMs]);
  return text;
}

export function ThreeColumnTranscription({
  darijaTarget,
  frTarget,
  arTarget,
  stage,
  className,
}: ThreeColumnTranscriptionProps) {
  const darijaActive = stage !== "empty";
  const frActive =
    stage === "fr-streaming" || stage === "ar-streaming" || stage === "complete";
  const arActive = stage === "ar-streaming" || stage === "complete";

  const darija = useStreamedText(darijaTarget, darijaActive, 22);
  const fr = useStreamedText(frTarget, frActive, 24);
  const ar = useStreamedText(arTarget, arActive, 30);

  const darijaDone = darija === darijaTarget;
  const frDone = fr === frTarget;
  const arDone = ar === arTarget;

  return (
    <div
      className={cn(
        "bg-surface border border-border-soft rounded-lg overflow-hidden",
        className,
      )}
      role="region"
      aria-label="Transcription tri-langue"
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-2 border-b border-border-soft">
        <Mic className="w-3 h-3 text-text-muted" strokeWidth={2} />
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
          Transcription tri-langue · Whisper Large v3
        </span>
      </div>
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-soft">
        <Panel
          label="🗣 Darija (parlé)"
          badge="SOURCE"
          highlight
          waiting={!darijaActive}
          text={darija}
          done={darijaDone}
          textClassName="font-mono text-[12.5px]"
          ariaLive="polite"
        />
        <Panel
          label="📄 Français (formel)"
          badge="LLM"
          waiting={!frActive}
          text={fr}
          done={frDone}
          textClassName="text-[13.5px]"
          ariaLive="polite"
        />
        <Panel
          label="📜 العربية (رسمية)"
          badge="LLM"
          waiting={!arActive}
          text={ar}
          done={arDone}
          textClassName="font-ar text-[15px] leading-[1.7]"
          rtl
          ariaLive="polite"
        />
      </div>
    </div>
  );
}

function Panel({
  label,
  badge,
  highlight,
  waiting,
  text,
  done,
  textClassName,
  rtl,
  ariaLive,
}: {
  label: string;
  badge: string;
  highlight?: boolean;
  waiting: boolean;
  text: string;
  done: boolean;
  textClassName?: string;
  rtl?: boolean;
  ariaLive?: "polite" | "off";
}) {
  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2",
          highlight ? "bg-sentinel-dim" : "bg-surface-2",
        )}
        dir={rtl ? "rtl" : "ltr"}
      >
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-wider",
            highlight ? "text-sentinel" : "text-text-muted",
          )}
        >
          {label}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
          {badge}
        </span>
      </div>
      <div
        className={cn(
          "px-3 py-3 min-h-[110px] text-text",
          rtl && "rtl-arabic",
          textClassName,
        )}
        aria-live={ariaLive}
        aria-atomic="false"
      >
        {waiting ? (
          <PlaceholderDots />
        ) : text === "" ? (
          <PlaceholderDots streaming />
        ) : (
          <>
            {text}
            {!done && (
              <span
                className="inline-block w-[2px] h-[14px] bg-current ml-0.5 align-middle animate-stream-blink"
                aria-hidden
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
