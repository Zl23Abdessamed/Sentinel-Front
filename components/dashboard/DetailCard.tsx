"use client";

import { Check, Clock, AlertTriangle, ShieldOff } from "lucide-react";
import type { Incident } from "@/lib/api";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusPill } from "@/components/shared/StatusPill";
import { RegulatoryReference } from "@/components/shared/RegulatoryReference";
import { CountdownTimer } from "@/components/shared/CountdownTimer";

// Selected-incident detail panel. Pulls workflow_steps / escalation_chain /
// regulatory_refs out of their JSON-string GORM columns and renders them
// inline. The footer holds the responder's actions: Acquitter / Rapport /
// Clôturer — wired through the page's callbacks.

interface DetailCardProps {
  incident: Incident;
  onAck?: () => void;
  onClose?: () => void;
  onReport?: () => void;
  busy?: boolean;
}

interface WorkflowStep {
  step_fr: string;
  role: string;
  sla_minutes: number;
  done?: boolean;
}

interface RegRef {
  law: string;
  article?: string;
  jurisdiction?: string;
  deadline_hours?: number;
}

function safeParse<T>(s: string, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export function DetailCard({
  incident,
  onAck,
  onClose,
  onReport,
  busy,
}: DetailCardProps) {
  const steps = safeParse<WorkflowStep[]>(incident.workflow_steps, []);
  const escalation = safeParse<string[]>(incident.escalation_chain, []);
  const regs = safeParse<RegRef[]>(incident.regulatory_refs, []);
  const closed =
    incident.status === "RESOLVED" || incident.status === "ARCHIVED";

  return (
    <Card className="space-y-4">
      <CardHeader className="!flex-row items-center gap-2 flex-wrap !mb-2">
        <SeverityBadge level={incident.severity} />
        <StatusPill status={incident.status} />
        {incident.mode === "CRISIS" && (
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 bg-[rgba(239,68,68,0.15)] text-p1 border-l-2 border-l-p1 rounded-sm animate-pulse-dot">
            CRISE · SLA × 3
          </span>
        )}
        <span className="ml-auto font-mono text-[12px] font-semibold text-sentinel tracking-wider">
          {incident.id}
        </span>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="text-h3 text-text">{incident.title_fr}</h3>
          <div className="rtl-arabic text-[14px] text-text-muted mt-1">
            {incident.title_ar}
          </div>
        </div>

        <p className="text-[13px] text-text-muted leading-relaxed">
          {incident.summary_fr}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-2 p-3 rounded-md">
            <div className="font-mono text-[10px] text-text-muted uppercase tracking-wider mb-2">
              Workflow ({steps.length} étapes)
            </div>
            <ul className="space-y-1.5">
              {steps.slice(0, 6).map((s, i) => (
                <li
                  key={i}
                  className="text-[12px] flex items-start gap-2"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-sm border ${
                      s.done
                        ? "bg-success border-success"
                        : "border-border-soft"
                    } mt-0.5 shrink-0 flex items-center justify-center`}
                  >
                    {s.done && (
                      <Check
                        className="w-2.5 h-2.5 text-white"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                  <span
                    className={
                      s.done ? "line-through text-text-dim" : "text-text"
                    }
                  >
                    {s.step_fr}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-text-dim shrink-0">
                    {s.sla_minutes}m
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface-2 p-3 rounded-md">
            <div className="font-mono text-[10px] text-text-muted uppercase tracking-wider mb-2">
              Chaîne d'escalade
            </div>
            <ol className="space-y-1.5">
              {escalation.map((r, i) => (
                <li
                  key={i}
                  className="text-[12px] flex items-center gap-2"
                >
                  <span className="font-mono text-[10px] text-text-dim w-4 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-text">{r}</span>
                </li>
              ))}
              {escalation.length === 0 && (
                <li className="text-[11px] text-text-dim italic">
                  Aucune chaîne définie.
                </li>
              )}
            </ol>
            {!closed && (
              <div className="mt-3 pt-3 border-t border-border-soft flex items-center gap-2 text-[11px] text-text-muted">
                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                <span>SLA :</span>
                <CountdownTimer
                  startedAt={incident.created_at}
                  slaMinutes={incident.sla_minutes}
                  compressed={incident.mode === "CRISIS"}
                />
              </div>
            )}
          </div>
        </div>

        {regs.length > 0 && (
          <RegulatoryReference
            law={regs[0].law}
            article={regs[0].article}
            jurisdiction={regs[0].jurisdiction}
            deadline={
              regs[0].deadline_hours
                ? `Notification sous ${regs[0].deadline_hours}h`
                : undefined
            }
            requirements={
              regs.length > 1
                ? regs
                    .slice(1)
                    .map((r) =>
                      [r.law, r.article].filter(Boolean).join(" · "),
                    )
                : undefined
            }
          />
        )}

        {incident.injection_detected && (
          <div className="text-[12px] text-p1 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] px-3 py-2 rounded-md flex items-start gap-2">
            <ShieldOff className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span>
              Texte adversarial détecté à l'intake — analyse en mode protégé.
            </span>
          </div>
        )}
        {incident.ai_disagreement && (
          <div className="text-[12px] text-p3 bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.3)] px-3 py-2 rounded-md flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span>
              Désaccord entre l'IA primaire et l'auditeur — vérification humaine
              recommandée.
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="!mt-4 gap-2 flex-wrap">
        {incident.status === "ACTIVE" && (
          <Button onClick={onAck} disabled={busy}>
            Acquitter
          </Button>
        )}
        {!closed && (
          <Button variant="outline" onClick={onReport} disabled={busy}>
            Générer le rapport
          </Button>
        )}
        {!closed && (
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Clôturer
          </Button>
        )}
        <span className="ml-auto font-mono text-[10px] text-text-dim flex items-center gap-1.5">
          <Clock className="w-3 h-3" strokeWidth={2} />
          Confiance IA: {incident.confidence}%
          {incident.counter_ai_score !== incident.confidence && (
            <span> · Auditeur: {incident.counter_ai_score}%</span>
          )}
        </span>
      </CardFooter>
    </Card>
  );
}
