"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditEvent } from "@/lib/api";

// One audit-chain row. Click expands an inline drawer with the full hash +
// prev_hash + parsed payload. Mono-dominant per design system §4.13.

const ACTION_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  REPORTED: { bg: "bg-[rgba(59,130,246,0.15)]", text: "text-p4", label: "REPORTED" },
  CLASSIFIED: { bg: "bg-sentinel-dim", text: "text-sentinel", label: "CLASSIFIED" },
  ACK: { bg: "bg-[rgba(16,185,129,0.15)]", text: "text-success", label: "ACK" },
  STEP_DONE: { bg: "bg-[rgba(16,185,129,0.15)]", text: "text-success", label: "STEP_DONE" },
  ESCALATED: { bg: "bg-[rgba(239,68,68,0.15)]", text: "text-p1", label: "ESCALATED" },
  CLOSED: { bg: "bg-[rgba(16,185,129,0.15)]", text: "text-success", label: "CLOSED" },
  REPORT_GENERATED: { bg: "bg-vault-dim", text: "text-vault", label: "REPORT" },
  BULLETIN_GENERATED: { bg: "bg-vault-dim", text: "text-vault", label: "BULLETIN" },
  INJECTION_DETECTED: { bg: "bg-[rgba(239,68,68,0.15)]", text: "text-p1", label: "INJECTION" },
  AI_DISAGREEMENT: { bg: "bg-[rgba(234,179,8,0.15)]", text: "text-p3", label: "DISAGREE" },
  VELOCITY_TRIGGERED: { bg: "bg-[rgba(239,68,68,0.15)]", text: "text-p1", label: "CRISE" },
  UNLOCK_REQUESTED: { bg: "bg-sentinel-dim", text: "text-sentinel", label: "UNLOCK_REQ" },
  UNLOCK_APPROVED: { bg: "bg-sentinel-dim", text: "text-sentinel", label: "UNLOCK_OK" },
  WHISPER_WINDOW_OPENED: { bg: "bg-[rgba(139,92,246,0.15)]", text: "text-whisper", label: "WHISPER_OPEN" },
  WHISPER_WINDOW_EXPIRED: { bg: "bg-[rgba(139,92,246,0.15)]", text: "text-whisper", label: "WHISPER_EXP" },
  WHISPER_SIGNAL_APPENDED: { bg: "bg-[rgba(139,92,246,0.15)]", text: "text-whisper", label: "WHISPER_SIG" },
};

function actionStyle(action: string) {
  return (
    ACTION_STYLES[action] ?? {
      bg: "bg-surface-2",
      text: "text-text-muted",
      label: action,
    }
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function EventRow({
  event,
  alt,
}: {
  event: AuditEvent;
  alt?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const style = actionStyle(event.action);

  let payloadFormatted = event.payload;
  try {
    payloadFormatted = JSON.stringify(JSON.parse(event.payload), null, 2);
  } catch {
    // keep original string
  }

  return (
    <>
      <tr
        className={cn(
          "border-b border-border-soft cursor-pointer transition-colors",
          alt ? "bg-surface-2" : "bg-surface",
          "hover:bg-surface-hover",
        )}
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <td className="px-3 py-2 font-mono text-[11px] text-text-dim tabular-nums whitespace-nowrap">
          {formatTime(event.created_at)}
        </td>
        <td className="px-3 py-2">
          <span
            className={cn(
              "font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm font-semibold inline-block",
              style.bg,
              style.text,
            )}
          >
            {style.label}
          </span>
        </td>
        <td className="px-3 py-2 font-mono text-[11px] text-sentinel">
          {event.incident_id}
        </td>
        <td className="px-3 py-2 font-mono text-[10px] text-text-dim">
          {event.actor_id_hash.slice(0, 8)}…
        </td>
        <td className="px-3 py-2 font-mono text-[10px] text-success">
          {event.hash.slice(0, 12)}…
        </td>
        <td className="px-3 py-2 text-text-dim">
          <ChevronDown
            className={cn(
              "w-3 h-3 transition-transform",
              expanded && "rotate-180",
            )}
            strokeWidth={2}
          />
        </td>
      </tr>
      {expanded && (
        <tr className={alt ? "bg-surface-2" : "bg-surface"}>
          <td colSpan={6} className="px-4 py-3 border-b border-border-soft">
            <div className="space-y-2">
              <div className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                Hash · prev_hash
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg p-2 rounded-md font-mono text-[10px] text-success break-all">
                  <span className="text-text-dim">hash:</span> {event.hash}
                </div>
                <div className="bg-bg p-2 rounded-md font-mono text-[10px] text-text-muted break-all">
                  <span className="text-text-dim">prev:</span> {event.prev_hash}
                </div>
              </div>
              <div className="font-mono text-[10px] text-text-muted uppercase tracking-wider mt-2">
                Payload JSON
              </div>
              <pre className="bg-bg p-2 rounded-md font-mono text-[11px] text-text whitespace-pre-wrap break-all max-h-64 overflow-auto">
                {payloadFormatted || "(vide)"}
              </pre>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
