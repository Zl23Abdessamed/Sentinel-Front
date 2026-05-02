"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldAlert, Shield, Clock, FileSearch, Zap } from "lucide-react";
import { sentinel, type Incident } from "@/lib/api";
import { getWsClient } from "@/lib/ws";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { Topbar } from "@/components/nav/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { IncidentRow } from "@/components/dashboard/IncidentRow";
import { DetailCard } from "@/components/dashboard/DetailCard";
import { CrisisBanner } from "@/components/dashboard/CrisisBanner";
import { Button } from "@/components/ui/button";

interface CrisisState {
  pattern: string;
  incidentCount: number;
  windowMinutes: number;
  triggeredAt: string;
}

const PHISHING_DEMO_TEXT =
  "J'ai cliqué sur un lien du Ministère ESRS et j'ai tapé mon mot de passe sur la page";

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<CrisisState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const initialFetchRef = useRef(false);

  const refresh = async (preserveSelection = true) => {
    try {
      const data = await sentinel.listIncidents(50);
      setIncidents(data.incidents);
      if (data.incidents.length > 0) {
        setSelectedId((cur) => {
          if (preserveSelection && cur && data.incidents.find((i) => i.id === cur)) {
            return cur;
          }
          return data.incidents[0].id;
        });
      }
    } catch (e) {
      console.error("dashboard fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;
    refresh(false);
  }, []);

  // WS subscriptions: any incident lifecycle event refreshes the list, and
  // CRISIS_TRIGGERED toggles the war-room overlay.
  useEffect(() => {
    const client = getWsClient();
    client.connect().catch(() => {});

    const offCreated = client.on("INCIDENT_CREATED", () => refresh());
    const offAck = client.on("INCIDENT_ACKNOWLEDGED", () => refresh());
    const offClose = client.on("INCIDENT_CLOSED", () => refresh());
    const offEscal = client.on("INCIDENT_ESCALATED", () => refresh());
    const offReport = client.on("REPORT_GENERATED", () => refresh());
    const offCrisis = client.on<{
      pattern: string;
      incident_count: number;
      window_minutes: number;
      triggered_at: string;
      crisis_id?: string;
    }>("CRISIS_TRIGGERED", (ev) => {
      setCrisis({
        pattern: ev.data.pattern,
        incidentCount: ev.data.incident_count,
        windowMinutes: ev.data.window_minutes,
        triggeredAt: ev.data.triggered_at ?? new Date().toISOString(),
      });
      document.body.classList.add("crisis-mode");
      refresh();
    });

    return () => {
      offCreated();
      offAck();
      offClose();
      offEscal();
      offReport();
      offCrisis();
    };
  }, []);

  // Cleanup body class on unmount
  useEffect(() => {
    return () => document.body.classList.remove("crisis-mode");
  }, []);

  const dismissCrisis = () => {
    setCrisis(null);
    document.body.classList.remove("crisis-mode");
  };

  // "Démo: déclencher la crise" — for demos without real WS pressure. Fires
  // 5 phishing intakes (using the canned fallback) then asks velocity to scan.
  // The WS broadcast handler above takes over from there.
  const triggerDemoCrisis = async () => {
    if (demoBusy) return;
    setDemoBusy(true);
    try {
      // Fire 5 intakes in parallel — backend's no-key fallback assigns the
      // same matched_campaign to each, so velocity will cluster them.
      await Promise.all(
        Array.from({ length: 5 }).map((_, i) =>
          sentinel.intake({
            text: PHISHING_DEMO_TEXT,
            reporter_id: `demo-${Date.now()}-${i}`,
            channel: "WEB",
            institution: "Université de démonstration",
            department: "Comptabilité",
          }),
        ),
      );
      await sentinel.velocityScan();
    } catch (e) {
      console.error("demo crisis trigger failed", e);
    } finally {
      setDemoBusy(false);
    }
  };

  const selected = incidents.find((i) => i.id === selectedId);

  const kpi = useMemo(() => {
    const active = incidents.filter(
      (i) => i.status === "ACTIVE" || i.status === "IN_PROGRESS",
    );
    const p1Active = active.filter((i) => i.severity === "P1").length;
    const total24h = incidents.filter(
      (i) => Date.now() - new Date(i.created_at).getTime() < 24 * 3600 * 1000,
    ).length;
    const resolved = incidents.filter((i) => i.status === "RESOLVED");
    const slaPct =
      resolved.length > 0
        ? Math.round(
            (resolved.filter((i) => {
              if (!i.closed_at) return false;
              const span =
                new Date(i.closed_at).getTime() -
                new Date(i.created_at).getTime();
              return span <= i.sla_minutes * 60_000;
            }).length /
              resolved.length) *
              100,
          )
        : 100;
    return { p1Active, total24h, slaPct, resolved: resolved.length };
  }, [incidents]);

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={`VUE RESPONDER · ${incidents.length} INCIDENTS · TEMPS REEL`}
          rightSlot={
            <Button
              variant={crisis ? "destructive" : "outline"}
              size="sm"
              onClick={triggerDemoCrisis}
              disabled={demoBusy}
              aria-label="Déclencher une crise de démonstration"
            >
              <Zap className="w-3.5 h-3.5" strokeWidth={2.2} />
              {demoBusy ? "..." : "Démo: Crise"}
            </Button>
          }
        />

        <div className="flex-1 grid grid-cols-[1fr_320px] gap-6 p-6 overflow-auto">
          <div className="space-y-6 min-w-0">
            {crisis && (
              <CrisisBanner
                pattern={crisis.pattern}
                incidentCount={crisis.incidentCount}
                windowMinutes={crisis.windowMinutes}
                triggeredAt={crisis.triggeredAt}
                onDismiss={dismissCrisis}
              />
            )}

            <section aria-label="Indicateurs">
              <div className="grid grid-cols-4 gap-4">
                <KPICard
                  label="P1 actifs"
                  value={kpi.p1Active}
                  variant={kpi.p1Active > 0 ? "critical" : "success"}
                  icon={<ShieldAlert className="w-3 h-3" />}
                />
                <KPICard
                  label="Incidents 24h"
                  value={kpi.total24h}
                  variant="amber"
                  icon={<Shield className="w-3 h-3" />}
                />
                <KPICard
                  label="SLA respecté"
                  value={`${kpi.slaPct}%`}
                  variant={
                    kpi.slaPct >= 90
                      ? "success"
                      : kpi.slaPct >= 70
                        ? "amber"
                        : "critical"
                  }
                  icon={<Clock className="w-3 h-3" />}
                />
                <KPICard
                  label="Résolus"
                  value={kpi.resolved}
                  variant="vault"
                  icon={<FileSearch className="w-3 h-3" />}
                />
              </div>
            </section>

            <section aria-label="Liste des incidents">
              <h2 className="text-h2 mb-3">File de signalements</h2>
              {loading ? (
                <div className="bg-surface border border-border rounded-lg p-8 text-center text-text-muted">
                  Chargement…
                </div>
              ) : incidents.length === 0 ? (
                <div className="bg-surface border border-border rounded-lg p-8 text-center text-text-muted italic">
                  Tout est calme. Aucun incident actif.
                </div>
              ) : (
                <div className="space-y-2">
                  {incidents.map((inc) => (
                    <IncidentRow
                      key={inc.id}
                      incident={inc}
                      selected={inc.id === selectedId}
                      onClick={() => setSelectedId(inc.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {selected && (
              <DetailCard
                incident={selected}
                busy={actionBusy}
                onAck={async () => {
                  setActionBusy(true);
                  try {
                    await sentinel.ack(selected.id, "RSSI");
                    await refresh();
                  } finally {
                    setActionBusy(false);
                  }
                }}
                onClose={async () => {
                  setActionBusy(true);
                  try {
                    await sentinel.close(selected.id, "RSSI");
                    await refresh();
                  } finally {
                    setActionBusy(false);
                  }
                }}
                onReport={() => {
                  window.location.href = `/incident/${selected.id}`;
                }}
              />
            )}
          </div>

          <LiveFeed />
        </div>
    </>
  );
}
