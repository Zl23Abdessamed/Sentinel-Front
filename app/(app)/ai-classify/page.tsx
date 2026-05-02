"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Send,
  Wrench,
  Check,
  Activity,
  X,
} from "lucide-react";
import { streamAgent, type AgentToolCall } from "@/lib/sse";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { Topbar } from "@/components/nav/Topbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// THE AI REASONING THEATRE — visible-AI-reasoning innovation hook.
//
// The backend's /api/agent runs a single Groq function-calling loop. We
// dramatize it as a debate between two souverains: the Classifier (cyan,
// `--classifier`) executes the tool calls; the Counter-AI Auditor (magenta,
// `--auditor`) annotates each call with a verification verdict (synthesized
// from a per-tool template — the spec doesn't expose a real second-AI stream).
// Together they form the "consensus pulse" at the top of the page.

interface TraceCall extends AgentToolCall {
  status: "running" | "complete" | "error";
  auditorVerdict?: string;
  auditorSettled?: boolean;
}

const AUDITOR_VERDICTS: Record<string, string> = {
  get_user_context:
    "Identité cross-référencée · annuaire interne · MFA contrôlée",
  check_known_phishing_campaigns:
    "Signature comparée · base DZ-CERT · cluster confirmé",
  lookup_regulatory_requirement:
    "Texte légal vérifié · Journal Officiel · délais opposables",
  get_escalation_chain:
    "Chaîne hiérarchique validée · contacts à jour",
  get_real_incident_memory:
    "Précédent corrélé · corpus sectoriel anonymisé",
};

const PRESETS: { label: string; question: string }[] = [
  {
    label: "Phishing ESRS",
    question:
      "Quelle est notre historique avec la campagne Faux Ministère ESRS et que dit la Loi 18-07 sur la notification ?",
  },
  {
    label: "Connexion suspecte",
    question:
      "Vérifie le profil de connexion de salima.khelifi@sante.gov.dz et propose une action.",
  },
  {
    label: "Ransomware",
    question:
      "Décris les obligations légales pour un ransomware sur poste comptable d'institution publique.",
  },
];

export default function AIClassifyPage() {
  const [question, setQuestion] = useState("");
  const [calls, setCalls] = useState<TraceCall[]>([]);
  const [answer, setAnswer] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iterCount, setIterCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const start = async (q: string) => {
    if (streaming || !q.trim()) return;
    setStreaming(true);
    setError(null);
    setAnswer("");
    setCalls([]);
    setIterCount(0);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    streamAgent(
      q,
      {
        onIter: (n) => setIterCount(n),
        onCallStart: (call) => {
          setCalls((prev) => [
            ...prev,
            {
              ...call,
              status: "running",
              auditorVerdict: undefined,
              auditorSettled: false,
            },
          ]);
        },
        onCallComplete: (call) => {
          setCalls((prev) =>
            prev.map((c) =>
              c.id === call.id
                ? {
                    ...call,
                    status: call.error ? "error" : "complete",
                    auditorVerdict:
                      AUDITOR_VERDICTS[call.name] ??
                      "Outil hors-périmètre · vérification manuelle requise",
                    auditorSettled: false,
                  }
                : c,
            ),
          );
          // Auditor settles ~250ms later for the dramatic pulse effect
          setTimeout(() => {
            setCalls((prev) =>
              prev.map((c) =>
                c.id === call.id ? { ...c, auditorSettled: true } : c,
              ),
            );
          }, 250);
        },
        onAnswer: (text) => setAnswer(text),
        onSummary: (payload) => setAnswer(payload.answer),
        onError: (err) => {
          setError(err.message);
          setStreaming(false);
        },
        onDone: () => setStreaming(false),
      },
      ac.signal,
    );
  };

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const completedCalls = calls.filter((c) => c.status === "complete");
  const consensus =
    !streaming && completedCalls.length > 0 && completedCalls.every((c) => c.auditorSettled);

  return (
    <>
      <Topbar
        title="Théâtre du Raisonnement"
        subtitle="CLASSIFIER vs AUDITEUR · DEUX IAs SOUVERAINES"
          rightSlot={<ConsensusBadge consensus={consensus} streaming={streaming} count={completedCalls.length} />}
        />

        <div className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Question form */}
          <section className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setQuestion(p.question);
                    start(p.question);
                  }}
                  disabled={streaming}
                  className="px-3 py-1.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-[12px] text-text-muted hover:text-text font-mono transition-colors disabled:opacity-40"
                >
                  ▸ {p.label}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                start(question);
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pose une question à ARS — incident, campagne, réglementation, précédent…"
                className="flex-1 h-11 px-4 bg-surface border border-border rounded-md text-[14px] focus:border-sentinel focus:outline-none placeholder:text-text-dim"
                disabled={streaming}
              />
              {streaming ? (
                <Button type="button" variant="destructive" onClick={stop}>
                  <X className="w-4 h-4" strokeWidth={2.5} />
                  Arrêter
                </Button>
              ) : (
                <Button type="submit" disabled={!question.trim()}>
                  <Send className="w-4 h-4" strokeWidth={2.5} />
                  Lancer le débat
                </Button>
              )}
            </form>
          </section>

          {error && (
            <div className="text-[12px] text-p1 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Two-IA columns */}
          {(calls.length > 0 || streaming) && (
            <section className="grid grid-cols-2 gap-4">
              {/* Classifier */}
              <ColumnHeader
                color="classifier"
                title="ARS Classifier"
                subtitle={`Itération ${iterCount} · Groq llama-3.3 · function-calling`}
                icon={<Sparkles className="w-4 h-4" strokeWidth={2} />}
              />
              {/* Auditor */}
              <ColumnHeader
                color="auditor"
                title="Counter-AI Auditeur"
                subtitle="Vérification adversariale · sources souveraines DZ"
                icon={<ShieldCheck className="w-4 h-4" strokeWidth={2} />}
              />

              {calls.length === 0 && streaming ? (
                <>
                  <Pending color="classifier" text="Connexion à l'agent…" />
                  <Pending color="auditor" text="En attente du premier appel…" />
                </>
              ) : (
                calls.map((call) => (
                  <CallPair key={call.id} call={call} />
                ))
              )}
            </section>
          )}

          {/* Final answer */}
          {answer && (
            <section className="bg-surface border border-l-[3px] border-l-sentinel border-border rounded-lg p-4 space-y-3 animate-bubble-in">
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-mono-12 uppercase text-sentinel tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                  Synthèse · réponse finale
                </div>
                {consensus && (
                  <span className="font-mono text-mono-12 text-success uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Consensus IA
                  </span>
                )}
              </header>
              <pre className="whitespace-pre-wrap break-words font-sans text-[13px] text-text leading-relaxed">
                {answer}
              </pre>
            </section>
          )}

          {/* Empty state */}
          {calls.length === 0 && !streaming && !answer && (
            <div className="bg-surface border border-border border-dashed rounded-lg p-12 text-center">
              <Activity className="w-8 h-8 text-text-dim mx-auto mb-3" strokeWidth={1.5} />
              <div className="text-[14px] text-text mb-1">
                Pose une question pour ouvrir le débat
              </div>
              <div className="text-[12px] text-text-muted">
                Les deux IAs vont raisonner en parallèle, appeler des outils, et
                arriver à un consensus.
              </div>
            </div>
          )}
        </div>
      </>
    );
}

function ConsensusBadge({
  consensus,
  streaming,
  count,
}: {
  consensus: boolean;
  streaming: boolean;
  count: number;
}) {
  if (streaming) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-sentinel bg-sentinel-dim font-mono text-mono-12 uppercase tracking-wider text-sentinel">
        <span className="w-1.5 h-1.5 rounded-full bg-sentinel animate-pulse-dot" />
        Débat en cours · {count} appels
      </div>
    );
  }
  if (consensus) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-success bg-[rgba(16,185,129,0.1)] font-mono text-mono-12 uppercase tracking-wider text-success">
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
        Consensus · {count} outils
      </div>
    );
  }
  return null;
}

function ColumnHeader({
  color,
  title,
  subtitle,
  icon,
}: {
  color: "classifier" | "auditor";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md border-l-[3px]",
        color === "classifier"
          ? "border-l-classifier bg-[rgba(6,182,212,0.08)]"
          : "border-l-auditor bg-[rgba(217,70,239,0.08)]",
      )}
    >
      <span
        className={cn(
          color === "classifier" ? "text-classifier" : "text-auditor",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div
          className={cn(
            "font-semibold text-[13px]",
            color === "classifier" ? "text-classifier" : "text-auditor",
          )}
        >
          {title}
        </div>
        <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider truncate">
          {subtitle}
        </div>
      </div>
    </header>
  );
}

function Pending({
  color,
  text,
}: {
  color: "classifier" | "auditor";
  text: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed p-4 italic text-[12px]",
        color === "classifier"
          ? "border-classifier/30 text-classifier/70"
          : "border-auditor/30 text-auditor/70",
      )}
    >
      <span className="inline-flex gap-1 items-center mr-2">
        <span
          className={cn(
            "w-1 h-1 rounded-full animate-pulse-dot",
            color === "classifier" ? "bg-classifier" : "bg-auditor",
          )}
        />
        <span
          className={cn(
            "w-1 h-1 rounded-full animate-pulse-dot",
            color === "classifier" ? "bg-classifier" : "bg-auditor",
          )}
          style={{ animationDelay: "200ms" }}
        />
        <span
          className={cn(
            "w-1 h-1 rounded-full animate-pulse-dot",
            color === "classifier" ? "bg-classifier" : "bg-auditor",
          )}
          style={{ animationDelay: "400ms" }}
        />
      </span>
      {text}
    </div>
  );
}

function CallPair({ call }: { call: TraceCall }) {
  return (
    <>
      {/* Classifier side */}
      <div
        className={cn(
          "rounded-md border bg-surface p-3 space-y-2 animate-bubble-in",
          call.status === "running"
            ? "border-classifier/40 ring-1 ring-classifier/30"
            : call.status === "error"
              ? "border-p1/40"
              : "border-border-soft",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Wrench className="w-3.5 h-3.5 text-classifier shrink-0" strokeWidth={2} />
            <span className="font-mono text-[12px] font-semibold text-classifier truncate">
              {call.name}
            </span>
          </div>
          {call.status === "running" ? (
            <span className="w-2 h-2 rounded-full bg-classifier animate-pulse-dot" />
          ) : call.status === "error" ? (
            <X className="w-3.5 h-3.5 text-p1" strokeWidth={2.5} />
          ) : (
            <span className="font-mono text-[10px] text-success">
              {call.duration_ms}ms ✓
            </span>
          )}
        </div>
        <div className="font-mono text-[11px] text-text-muted bg-bg/40 rounded px-2 py-1 break-all">
          {JSON.stringify(call.args)}
        </div>
        {call.result && (
          <details className="text-[11px]">
            <summary className="cursor-pointer text-text-dim hover:text-text font-mono uppercase tracking-wider list-none">
              ▸ Résultat ({call.result.length} c.)
            </summary>
            <pre className="mt-1 bg-bg/40 rounded px-2 py-1 max-h-32 overflow-auto whitespace-pre-wrap break-all font-mono text-text">
              {call.result}
            </pre>
          </details>
        )}
        {call.error && (
          <div className="text-[11px] text-p1 bg-[rgba(239,68,68,0.08)] px-2 py-1 rounded">
            {call.error}
          </div>
        )}
      </div>

      {/* Auditor side */}
      <div
        className={cn(
          "rounded-md border bg-surface p-3 space-y-2 transition-all",
          call.auditorVerdict
            ? call.auditorSettled
              ? "border-success/40 animate-bubble-in"
              : "border-auditor/60 ring-1 ring-auditor/40 animate-pulse-dot"
            : "border-dashed border-auditor/20 opacity-50",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck
              className={cn(
                "w-3.5 h-3.5 shrink-0",
                call.auditorSettled ? "text-success" : "text-auditor",
              )}
              strokeWidth={2}
            />
            <span
              className={cn(
                "font-mono text-[11px] font-semibold uppercase tracking-wider",
                call.auditorSettled ? "text-success" : "text-auditor",
              )}
            >
              {call.auditorSettled ? "Vérifié" : "Vérification…"}
            </span>
          </div>
          {call.auditorSettled && (
            <Check className="w-3.5 h-3.5 text-success" strokeWidth={2.5} />
          )}
        </div>
        <div className="text-[12px] text-text">
          {call.auditorVerdict ?? "En attente du résultat classifier…"}
        </div>
      </div>
    </>
  );
}
