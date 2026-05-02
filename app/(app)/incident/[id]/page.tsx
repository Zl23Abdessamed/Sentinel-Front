"use client";

import { useEffect, useState } from "react";
import { sentinel, type Incident } from "@/lib/api";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { Topbar } from "@/components/nav/Topbar";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusPill } from "@/components/shared/StatusPill";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { StreamingReport } from "@/components/incident/StreamingReport";
import { DecisionTreePathViewer } from "@/components/incident/DecisionTreePathViewer";
import { PlaybookView } from "@/components/incident/PlaybookView";
import { SealedIdentityCard } from "@/components/incident/SealedIdentityCard";
import { Loi1807Counter } from "@/components/incident/Loi1807Counter";
import { ApiError } from "@/lib/api";

interface PageProps {
  params: { id: string };
}

interface WorkflowStep {
  step_fr: string;
  role: string;
  sla_minutes: number;
  done?: boolean;
  automation?: string;
}

function safeParse<T>(s: string | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export default function IncidentDetailPage({ params }: PageProps) {
  const { id } = params;
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const inc = await sentinel.getIncident(id);
      setIncident(inc);
      setError(null);
    } catch (e) {
      setIncident(null);
      setError(
        e instanceof ApiError && e.status === 404
          ? "Cet incident n'existe pas dans la base."
          : "Erreur de chargement",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const decisionPath = incident
    ? safeParse<string[]>(incident.decision_tree_path, [])
    : [];
  const workflowSteps = incident
    ? safeParse<WorkflowStep[]>(incident.workflow_steps, [])
    : [];
  const escalation = incident
    ? safeParse<string[]>(incident.escalation_chain, [])
    : [];
  const closed =
    incident?.status === "RESOLVED" || incident?.status === "ARCHIVED";

  return (
    <>
      <Topbar
          title={
            loading
              ? "Chargement..."
              : incident
                ? incident.title_fr
                : "Incident introuvable"
          }
          subtitle={
            loading
              ? ""
              : incident
                ? `${incident.id} · ${incident.category} · CRÉÉ ${new Date(incident.created_at).toLocaleString("fr-FR")}`
                : "ID inconnu"
          }
        />

        {loading ? (
          <div className="p-8 text-center text-text-muted">Chargement…</div>
        ) : !incident ? (
          <div className="p-8 text-center text-text-dim italic">
            {error ?? "Incident introuvable."}
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-[1fr_320px] gap-6 p-6 overflow-auto">
            <div className="space-y-6 min-w-0">
              {/* Header chips */}
              <div className="flex items-center gap-3 flex-wrap">
                <SeverityBadge level={incident.severity} />
                <StatusPill status={incident.status} />
                {incident.mode === "CRISIS" && (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 bg-[rgba(239,68,68,0.15)] text-p1 border-l-2 border-l-p1 rounded-sm animate-pulse-dot">
                    CRISE · SLA × 3
                  </span>
                )}
                {incident.grace_period_flag && (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 bg-[rgba(16,185,129,0.15)] text-success border-l-2 border-l-success rounded-sm">
                    Délai de grâce respecté
                  </span>
                )}
                {incident.injection_detected && (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 bg-[rgba(239,68,68,0.15)] text-p1 border-l-2 border-l-p1 rounded-sm">
                    Injection détectée
                  </span>
                )}
                {incident.ai_disagreement && (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 bg-[rgba(234,179,8,0.15)] text-p3 border-l-2 border-l-p3 rounded-sm">
                    Désaccord IA
                  </span>
                )}
                <span className="ml-auto font-mono text-[14px] font-semibold text-sentinel tracking-wider">
                  {incident.id}
                </span>
              </div>

              {/* Identity + Loi 18-07 */}
              <div className="grid grid-cols-2 gap-4">
                <SealedIdentityCard
                  incidentId={incident.id}
                  isWhisper={incident.category === "WHISPER"}
                />
                {incident.loi_18_07_triggered ? (
                  <Loi1807Counter
                    triggeredAt={incident.created_at}
                    deadlineAt={incident.loi_18_07_deadline_at}
                  />
                ) : (
                  <div className="bg-surface border border-border rounded-lg p-4">
                    <div className="font-mono text-[11px] text-text-muted uppercase tracking-wider mb-1">
                      Loi 18-07
                    </div>
                    <div className="text-[13px] text-text-muted">
                      Non déclenchée pour cet incident.
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <div className="text-h3 text-text">{incident.title_fr}</div>
                  <div className="rtl-arabic text-[15px] text-text-muted mt-1">
                    {incident.title_ar}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-[13px] text-text leading-relaxed">
                    {incident.summary_fr}
                  </p>
                  <details>
                    <summary className="text-mono-12 text-text-dim cursor-pointer hover:text-text-muted uppercase tracking-wider list-none">
                      ▸ Résumé arabe
                    </summary>
                    <p className="rtl-arabic text-[15px] text-text-muted mt-2 leading-[1.7]">
                      {incident.summary_ar}
                    </p>
                  </details>
                  {incident.matched_campaign && (
                    <div className="text-[12px] bg-surface-2 px-3 py-2 rounded-md">
                      <span className="font-mono text-[10px] text-sentinel uppercase tracking-wider mr-2">
                        CAMPAGNE
                      </span>
                      <span className="text-text">
                        {incident.matched_campaign}
                      </span>
                    </div>
                  )}
                  {!closed && (
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      <span>SLA :</span>
                      <CountdownTimer
                        startedAt={incident.created_at}
                        slaMinutes={incident.sla_minutes}
                        compressed={incident.mode === "CRISIS"}
                        format="long"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Decision tree */}
              {decisionPath.length > 0 && (
                <DecisionTreePathViewer path={decisionPath} />
              )}

              {/* Playbook */}
              <PlaybookView
                playbookId={incident.playbook_id}
                steps={workflowSteps}
              />

              {/* Escalation chain */}
              <Card>
                <CardHeader>
                  <div className="font-mono text-mono-12 uppercase tracking-wider text-text-muted">
                    Chaîne d'escalade
                  </div>
                </CardHeader>
                <CardContent>
                  {escalation.length === 0 ? (
                    <div className="text-[12px] text-text-dim italic">
                      Aucune chaîne d'escalade définie.
                    </div>
                  ) : (
                    <ol className="space-y-1.5">
                      {escalation.map((r, i) => (
                        <li
                          key={i}
                          className="text-[13px] flex items-center gap-3"
                        >
                          <span className="font-mono text-[10px] text-text-dim w-5 shrink-0">
                            {i + 1}.
                          </span>
                          <span className="text-text">{r}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {incident.status === "ACTIVE" && (
                  <Button
                    onClick={async () => {
                      setActionBusy(true);
                      try {
                        await sentinel.ack(incident.id, "RSSI");
                        await refresh();
                      } finally {
                        setActionBusy(false);
                      }
                    }}
                    disabled={actionBusy}
                  >
                    Acquitter
                  </Button>
                )}
                {!closed && (
                  <Button
                    variant="outline"
                    onClick={() => setShowReport(true)}
                    disabled={actionBusy || showReport}
                  >
                    Générer le rapport de clôture
                  </Button>
                )}
                {!closed && (
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      setActionBusy(true);
                      try {
                        await sentinel.close(incident.id, "RSSI");
                        await refresh();
                      } finally {
                        setActionBusy(false);
                      }
                    }}
                    disabled={actionBusy}
                  >
                    Clôturer
                  </Button>
                )}
                <span className="ml-auto font-mono text-[10px] text-text-dim">
                  Confiance IA : {incident.confidence}%
                  {incident.counter_ai_score !== incident.confidence && (
                    <> · Auditeur : {incident.counter_ai_score}%</>
                  )}
                </span>
              </div>

              {/* Streaming report — mounts on demand, auto-streams on mount */}
              {showReport && (
                <StreamingReport
                  incidentId={incident.id}
                  onDone={() => refresh()}
                />
              )}
            </div>

            <LiveFeed />
          </div>
        )}
    </>
  );
}
