"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getWsClient, type WsEvent } from "@/lib/ws";

// Right-rail strip showing incoming WS events. Subscribes to "*" so every
// broadcast type lands here. New rows slide in from the right; oldest scroll
// off when count > MAX_ROWS.

interface FeedRow {
  id: string;
  ts: string;
  body: string;
  tag: keyof typeof TAG_STYLES;
}

const TAG_STYLES = {
  intake:   { bg: "bg-[rgba(59,130,246,0.15)]",  text: "text-p4",       label: "INTAKE"   },
  classify: { bg: "bg-sentinel-dim",             text: "text-sentinel", label: "CLASSIFY" },
  ack:      { bg: "bg-[rgba(16,185,129,0.15)]",  text: "text-success",  label: "ACK"      },
  escalate: { bg: "bg-[rgba(239,68,68,0.15)]",   text: "text-p1",       label: "ESCALATE" },
  resolve:  { bg: "bg-[rgba(16,185,129,0.15)]",  text: "text-success",  label: "RESOLVE"  },
  velocity: { bg: "bg-[rgba(239,68,68,0.15)]",   text: "text-p1",       label: "CRISE"    },
  report:   { bg: "bg-vault-dim",                text: "text-vault",    label: "REPORT"   },
  whisper:  { bg: "bg-[rgba(139,92,246,0.15)]",  text: "text-whisper",  label: "WHISPER"  },
  unlock:   { bg: "bg-sentinel-dim",             text: "text-sentinel", label: "UNLOCK"   },
} as const;

const MAX_ROWS = 12;

function formatTime(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function eventToRow(ev: WsEvent): FeedRow | null {
  const ts = formatTime(new Date());
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = ev.data as any;
  switch (ev.type) {
    case "INCIDENT_CREATED":
      return {
        id, ts, tag: "intake",
        body: `${data?.id ?? ""} · ${data?.category ?? ""} · ${data?.severity ?? ""}`,
      };
    case "INCIDENT_ACKNOWLEDGED":
      return { id, ts, tag: "ack", body: `${data?.incident_id} acquitté par ${data?.actor ?? "—"}` };
    case "INCIDENT_ESCALATED":
      return { id, ts, tag: "escalate", body: `${data?.incident_id} escaladé` };
    case "INCIDENT_CLOSED":
      return { id, ts, tag: "resolve", body: `${data?.incident_id} clôturé` };
    case "REPORT_GENERATED":
      return { id, ts, tag: "report", body: `Rapport · ${data?.incident_id} · ${data?.chars} car.` };
    case "CRISIS_TRIGGERED":
      return {
        id, ts, tag: "velocity",
        body: `CRISE · ${data?.pattern ?? ""} · ${data?.incident_count ?? 0} incidents`,
      };
    case "WHISPER_CREATED":
      return { id, ts, tag: "whisper", body: `Murmure ouvert · ${data?.department ?? "—"}` };
    case "WHISPER_SIGNAL":
      return { id, ts, tag: "whisper", body: `Signal · ${data?.window_id?.slice(0, 8) ?? ""}…` };
    case "UNLOCK_REQUESTED":
      return { id, ts, tag: "unlock", body: `Déverrouillage demandé · ${data?.incident_id}` };
    case "UNLOCK_APPROVED":
      return { id, ts, tag: "unlock", body: `Identité révélée · ${data?.incident_id}` };
    default:
      return null;
  }
}

interface LiveFeedProps {
  className?: string;
  /** When true, seeds the feed with three sample rows so empty pages still feel alive */
  seed?: boolean;
}

export function LiveFeed({ className, seed = false }: LiveFeedProps) {
  const [rows, setRows] = useState<FeedRow[]>(() =>
    seed
      ? [
          { id: "s1", ts: "09:42:08", tag: "intake",   body: "INC-2026-A7B3 · PHISHING · P2" },
          { id: "s2", ts: "09:42:14", tag: "classify", body: "Classification IA · 88% confiance" },
          { id: "s3", ts: "09:43:01", tag: "ack",      body: "INC-2026-A7B3 acquitté par RSSI" },
        ]
      : [],
  );
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = getWsClient();
    client.connect().catch(() => { /* silent — _close listener handles UI */ });

    const offOpen  = client.on("_open",  () => setConnected(true));
    const offClose = client.on("_close", () => setConnected(false));
    const off = client.on<WsEvent["data"]>("*", (ev) => {
      if (ev.type.startsWith("_")) return;
      const row = eventToRow(ev);
      if (!row) return;
      setRows((prev) => [row, ...prev].slice(0, MAX_ROWS));
    });
    setConnected(client.isOpen());
    return () => {
      offOpen();
      offClose();
      off();
    };
  }, []);

  return (
    <aside
      className={cn("bg-surface border border-border rounded-lg p-4 w-full", className)}
      aria-label="Flux temps-réel"
    >
      <header className="flex items-center justify-between mb-3">
        <div className="text-mono-12 uppercase text-text-muted">Flux temps-réel</div>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase tracking-wider">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              connected ? "bg-success animate-pulse-dot" : "bg-text-dim",
            )}
          />
          {connected ? "EN LIGNE" : "HORS LIGNE"}
        </span>
      </header>
      <div className="flex flex-col gap-1.5">
        {rows.length === 0 && (
          <div className="text-[12px] text-text-dim italic py-6 text-center">
            En attente d'événements…
          </div>
        )}
        {rows.map((row) => {
          const style = TAG_STYLES[row.tag];
          return (
            <div
              key={row.id}
              className="bg-surface-2 border border-border rounded-md px-2.5 py-2 animate-feed-in"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-text-dim tabular-nums">{row.ts}</span>
                <span
                  className={cn(
                    "font-mono text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm",
                    style.bg,
                    style.text,
                  )}
                >
                  {style.label}
                </span>
              </div>
              <div className="text-[12px] text-text">{row.body}</div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
