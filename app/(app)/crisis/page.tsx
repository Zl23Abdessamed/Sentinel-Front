"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Zap,
  Activity,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  sentinel,
  type AuditEvent,
  type Incident,
} from "@/lib/api";
import { getWsClient } from "@/lib/ws";
import { Topbar } from "@/components/nav/Topbar";
import { CrisisBanner } from "@/components/dashboard/CrisisBanner";
import { IncidentRow } from "@/components/dashboard/IncidentRow";
import { Button } from "@/components/ui/button";

// /crisis — dedicated page for the war-room state. Shows:
//   - the active crisis banner if WS has fired CRISIS_TRIGGERED in this session
//   - the cluster incidents (everything currently in mode=CRISIS)
//   - history of past VELOCITY_TRIGGERED events from the audit chain
//   - a "Déclencher démo" button so judges can trigger the crisis live

interface ActiveCrisis {
  pattern: string;
  incidentCount: number;
  windowMinutes: number;
  triggeredAt: string;
  incidentIds?: string[];
}

interface CrisisHistoryEntry {
  id: string;
  incident_id: string;
  created_at: string;
  hash: string;
  pattern?: string;
  trigger_count?: number;
}

const PHISHING_DEMO_TEXT =
  "J'ai cliqué sur un lien du Ministère ESRS et j'ai tapé mon mot de passe sur la page";

export default function CrisisPage() {
  const [activeCrisis, setActiveCrisis] = useState<ActiveCrisis | null>(null);
  const [crisisIncidents, setCrisisIncidents] = useState<Incident[]>([]);
  const [history, setHistory] = useState<CrisisHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoBusy, setDemoBusy] = useState(false);
  const initialFetchRef = useRef(false);

  const refresh = async () => {
    try {
      const [incidentsResp, eventsResp] = await Promise.all([
        sentinel.listIncidents(100),
        sentinel.blackbox.list({
          action: "VELOCITY_TRIGGERED",
          limit: 25,
          order: "desc",
        }),
      ]);

      const inCrisis = incidentsResp.incidents.filter(
        (i) => i.mode === "CRISIS",
      );
      setCrisisIncidents(inCrisis);
      setHistory(eventsResp.events.map(parseHistoryEntry));
    } catch (e) {
      console.error("crisis fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;
    refresh();
  }, []);

  // Subscribe to live crisis broadcasts + incident lifecycle to refresh
  useEffect(() => {
    const client = getWsClient();
    client.connect().catch(() => {});

    const offCrisis = client.on<{
      pattern: string;
      incident_count: number;
      window_minutes: number;
      triggered_at: string;
      incident_ids?: string[];
    }>("CRISIS_TRIGGERED", (ev) => {
      setActiveCrisis({
        pattern: ev.data.pattern,
        incidentCount: ev.data.incident_count,
        windowMinutes: ev.data.window_minutes,
        triggeredAt: ev.data.triggered_at ?? new Date().toISOString(),
        incidentIds: ev.data.incident_ids,
      });
      document.body.classList.add("crisis-mode");
      refresh();
    });

    const offCreate = client.on("INCIDENT_CREATED", () => refresh());
    const offClose = client.on("INCIDENT_CLOSED", () => refresh());

    return () => {
      offCrisis();
      offCreate();
      offClose();
    };
  }, []);

  // Cleanup body class on unmount
  useEffect(
    () => () => document.body.classList.remove("crisis-mode"),
    [],
  );

  const dismissCrisis = () => {
    setActiveCrisis(null);
    document.body.classList.remove("crisis-mode");
  };

  // "Déclencher démo de crise" — fires 5 phishing intakes + manual velocity scan
  const triggerDemo = async () => {
    if (demoBusy) return;
    setDemoBusy(true);
    try {
      await Promise.all(
        Array.from({ length: 5 }).map((_, i) =>
          sentinel.intake({
            text: PHISHING_DEMO_TEXT,
            reporter_id: `crisis-demo-${Date.now()}-${i}`,
            channel: "WEB",
            institution: "Université de démonstration",
            department: "Comptabilité",
          }),
        ),
      );
      await sentinel.velocityScan();
    } catch (e) {
      console.error("crisis demo failed", e);
    } finally {
      setDemoBusy(false);
    }
  };

  const lastHistory = history[0];
  const inCrisisNow = !!activeCrisis || crisisIncidents.length > 0;

  // If a crisis is loaded from incidents but we have no active broadcast, surface the most recent history entry as the "current" crisis context.
  const displayedCrisis = useMemo<ActiveCrisis | null>(() => {
    if (activeCrisis) return activeCrisis;
    if (crisisIncidents.length === 0) return null;
    return {
      pattern: lastHistory?.pattern ?? "Cluster d'incidents",
      incidentCount: crisisIncidents.length,
      windowMinutes: 10,
      triggeredAt: lastHistory?.created_at ?? crisisIncidents[0].created_at,
    };
  }, [activeCrisis, crisisIncidents, lastHistory]);

  return (
    <div className="flex-1 flex flex-col bg-bg w-full relative z-10">
      <Topbar
        title="Mode Crise"
        subtitle="WAR ROOM · DÉTECTEUR DE VÉLOCITÉ · 5-EN-10"
        rightSlot={
          <Button
            variant={inCrisisNow ? "destructive" : "outline"}
            size="sm"
            onClick={triggerDemo}
            disabled={demoBusy}
          >
            <Zap className="w-3.5 h-3.5" strokeWidth={2.2} />
            {demoBusy ? "Déclenchement…" : "Démo: Crise"}
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Active crisis banner */}
        {displayedCrisis ? (
          <CrisisBanner
            pattern={displayedCrisis.pattern}
            incidentCount={displayedCrisis.incidentCount}
            windowMinutes={displayedCrisis.windowMinutes}
            triggeredAt={displayedCrisis.triggeredAt}
            onDismiss={activeCrisis ? dismissCrisis : undefined}
          />
        ) : (
          <EmptyState onDemo={triggerDemo} demoBusy={demoBusy} loading={loading} />
        )}

        {/* Cluster incidents */}
        {crisisIncidents.length > 0 && (
          <section>
            <SectionHeader
              icon={<ShieldAlert className="w-4 h-4 text-p1" strokeWidth={2} />}
              title={`Cluster en cours · ${crisisIncidents.length} incident${crisisIncidents.length > 1 ? "s" : ""}`}
              hint="SLA × 3 · escalade automatique"
            />
            <div className="space-y-2">
              {crisisIncidents.map((inc) => (
                <Link key={inc.id} href={`/incident/${inc.id}`} className="block">
                  <IncidentRow incident={inc} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Standard dashboard handoff */}
        <section className="grid grid-cols-2 gap-4">
          <NextStepCard
            href="/dashboard"
            icon={<Activity className="w-4 h-4 text-sentinel" strokeWidth={2} />}
            title="Dashboard standard"
            text="Tous les signalements (P1 / P2 / P3 / P4) avec triage et SLA live."
          />
          <NextStepCard
            href="/black-box"
            icon={<ShieldCheck className="w-4 h-4 text-vault" strokeWidth={2} />}
            title="Boîte Noire · audit chain"
            text="Trace SHA-256 append-only de chaque action, exportable ASSI-1.0."
          />
        </section>

        {/* History */}
        <section>
          <SectionHeader
            icon={<Clock className="w-4 h-4 text-text-muted" strokeWidth={2} />}
            title={`Historique des crises · ${history.length} déclenchement${history.length > 1 ? "s" : ""}`}
            hint="Source : Boîte Noire · action VELOCITY_TRIGGERED"
          />
          {loading ? (
            <div className="bg-surface border border-border rounded-lg p-8 text-center text-text-muted">
              Chargement…
            </div>
          ) : history.length === 0 ? (
            <div className="bg-surface border border-border border-dashed rounded-lg p-8 text-center text-text-dim italic">
              Aucune crise n'a été déclenchée pour cette organisation. Tape sur
              <span className="text-sentinel mx-1.5">Démo: Crise</span> en haut
              à droite pour en simuler une.
            </div>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="bg-surface border border-border rounded-md px-4 py-3 flex items-center gap-3"
                >
                  <ShieldAlert className="w-4 h-4 text-p1 shrink-0" strokeWidth={2} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-text font-medium truncate">
                      {h.pattern ?? "Cluster détecté"}
                    </div>
                    <div className="font-mono text-[10px] text-text-dim mt-0.5">
                      {new Date(h.created_at).toLocaleString("fr-FR")} ·{" "}
                      {h.trigger_count ?? "?"} incidents · {h.incident_id}
                    </div>
                  </div>
                  <Link
                    href={`/incident/${h.incident_id}`}
                    className="font-mono text-[10px] text-text-muted hover:text-sentinel uppercase tracking-wider inline-flex items-center gap-1"
                  >
                    Ouvrir
                    <ArrowRight className="w-3 h-3" strokeWidth={2} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function EmptyState({
  onDemo,
  demoBusy,
  loading,
}: {
  onDemo: () => void;
  demoBusy: boolean;
  loading: boolean;
}) {
  return (
    <div className="bg-surface border border-border border-dashed rounded-lg p-10 text-center">
      <div className="w-14 h-14 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-4 text-success">
        <ShieldCheck className="w-6 h-6" strokeWidth={2} />
      </div>
      <h2 className="text-h2 text-text mb-1">Tout est calme</h2>
      <p className="text-text-muted text-[13px] max-w-xl mx-auto mb-5 leading-relaxed">
        Aucune crise active. Le détecteur de vélocité scrute la file en
        permanence : si <strong className="text-text">5 signalements
        similaires</strong> arrivent en moins de{" "}
        <strong className="text-text">10 minutes</strong>, le mode Crise
        s'active automatiquement, les SLAs sont compressés ×3 et le playbook
        coordonné est déployé.
      </p>
      <Button
        variant="default"
        onClick={onDemo}
        disabled={demoBusy || loading}
      >
        <Zap className="w-3.5 h-3.5" strokeWidth={2.2} />
        {demoBusy
          ? "Génération de 5 signalements…"
          : "Déclencher une crise de démo"}
      </Button>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <header className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-h2">{title}</h2>
      </div>
      {hint && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          {hint}
        </span>
      )}
    </header>
  );
}

function NextStepCard({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-surface border border-border rounded-lg p-4 hover:border-border-soft hover:bg-surface-hover transition-colors group"
    >
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-[13px] font-semibold text-text">{title}</span>
        <ArrowRight
          className="ml-auto w-3.5 h-3.5 text-text-dim group-hover:text-sentinel group-hover:translate-x-0.5 transition-all"
          strokeWidth={2}
        />
      </div>
      <p className="text-[12px] text-text-muted">{text}</p>
    </Link>
  );
}

function parseHistoryEntry(ev: AuditEvent): CrisisHistoryEntry {
  let pattern: string | undefined;
  let triggerCount: number | undefined;
  try {
    const p = JSON.parse(ev.payload || "{}");
    pattern = typeof p.pattern === "string" ? p.pattern : undefined;
    triggerCount =
      typeof p.trigger_count === "number" ? p.trigger_count : undefined;
  } catch {
    /* keep defaults */
  }
  return {
    id: ev.id,
    incident_id: ev.incident_id,
    created_at: ev.created_at,
    hash: ev.hash,
    pattern,
    trigger_count: triggerCount,
  };
}

