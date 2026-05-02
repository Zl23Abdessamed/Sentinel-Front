"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { streamReport, type ReportMeta } from "@/lib/sse";
import { cn } from "@/lib/utils";

// Char-by-char rendering of /api/incident/:id/report SSE. Auto-streams as soon
// as the component mounts — the parent decides when to mount it. Strict-mode
// safe: the cleanup abort cancels in-flight requests, the next mount restarts
// from scratch (never blocked by a "started" flag).

interface StreamingReportProps {
  incidentId: string;
  onDone?: (chars: number) => void;
  className?: string;
}

export function StreamingReport({
  incidentId,
  onDone,
  className,
}: StreamingReportProps) {
  const [text, setText] = useState("");
  const [meta, setMeta] = useState<ReportMeta | null>(null);
  const [phase, setPhase] = useState<"streaming" | "done" | "error">(
    "streaming",
  );
  const [error, setError] = useState<string | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!incidentId) return;
    const ac = new AbortController();
    setText("");
    setMeta(null);
    setError(null);
    setPhase("streaming");

    streamReport(
      incidentId,
      {
        onMeta: (m) => setMeta(m),
        onToken: (t) => setText((prev) => prev + t),
        onDone: (payload) => {
          setPhase("done");
          onDoneRef.current?.(payload.chars);
        },
        onError: (err) => {
          if (err.name === "AbortError") return;
          setError(err.message);
          setPhase("error");
        },
      },
      ac.signal,
    );

    return () => ac.abort();
  }, [incidentId]);

  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-lg p-4 space-y-3",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-sentinel shrink-0" strokeWidth={2} />
          <span className="font-mono text-mono-12 uppercase tracking-wider text-sentinel shrink-0">
            Rapport de clôture
          </span>
          {meta && (
            <span className="text-text-muted text-[12px] truncate">
              {meta.title_fr}
            </span>
          )}
        </div>
        {phase === "streaming" && (
          <div className="flex items-center gap-1.5 font-mono text-mono-12 text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-sentinel animate-pulse-dot" />
            STREAMING
          </div>
        )}
        {phase === "done" && (
          <div className="flex items-center gap-1.5 font-mono text-mono-12 text-success">
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            SCELLÉ · {text.length} caractères
          </div>
        )}
      </header>

      {error && (
        <div className="text-[12px] text-p1 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {(phase === "streaming" || phase === "done" || text) && (
        <pre className="bg-surface-2 p-4 rounded-md text-[13px] text-text whitespace-pre-wrap break-words font-sans leading-relaxed max-h-[600px] overflow-auto">
          {text}
          {phase === "streaming" && (
            <span
              className="inline-block w-[2px] h-4 bg-current ml-0.5 align-middle animate-stream-blink"
              aria-hidden
            />
          )}
        </pre>
      )}
    </div>
  );
}
