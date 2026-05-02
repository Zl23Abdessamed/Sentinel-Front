"use client";

import { useEffect, useMemo, useState } from "react";
import { Shield, Globe, FileSearch, Activity, Download } from "lucide-react";
import { sentinel, type Incident } from "@/lib/api";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { AlgeriaMap, type Wilaya } from "@/components/pulse/AlgeriaMap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Closing screen — the report-living-for-PM-and-ANCS view. Mostly numbers
// (some real from the backend, some demo for the closing slide), an animated
// wilaya map, a category breakdown, a live ticker, and a sovereign compliance
// strip.

const WILAYAS: Wilaya[] = [
  { name: "Alger",       x: 240, y: 90,  severity: "P1", count: 47, origin: true },
  { name: "Oran",        x: 135, y: 115, severity: "P2", count: 31 },
  { name: "Constantine", x: 380, y: 85,  severity: "P2", count: 25 },
  { name: "Annaba",      x: 450, y: 80,  severity: "P3", count: 23 },
  { name: "Tlemcen",     x: 100, y: 110, severity: "P3", count: 13 },
  { name: "Sétif",       x: 320, y: 100, severity: "P2", count: 19 },
  { name: "Blida",       x: 250, y: 105, severity: "P3", count: 9 },
  { name: "Béjaïa",      x: 295, y: 95,  severity: "P3", count: 6 },
  { name: "Ghardaïa",    x: 280, y: 145, severity: "P3", count: 47 },
  { name: "Ouargla",     x: 350, y: 150, severity: "P4", count: 30 },
  { name: "Béchar",      x: 200, y: 165, severity: "P4", count: 8 },
  { name: "Tamanrasset", x: 320, y: 195, severity: "P4", count: 11 },
  { name: "Adrar",       x: 250, y: 195, severity: "P4", count: 1 },
];

const TOP_CATEGORIES = [
  { name: "Phishing — Ministère ESRS", value: 247, pct: 88 },
  { name: "Phishing — CCP",            value: 178, pct: 64 },
  { name: "Faux SMS livraison",        value: 134, pct: 48 },
  { name: "Ransomware (poste)",        value: 92,  pct: 33 },
  { name: "Connexion suspecte M365",   value: 84,  pct: 30 },
  { name: "Fuite credentials",         value: 56,  pct: 20 },
  { name: "Lost device · USB",         value: 41,  pct: 15 },
  { name: "Autres / non classifié",    value: 23,  pct: 8 },
];

const COMPLIANCE_STATS = [
  { label: "Mandats magistrats", value: 47 },
  { label: "Refus motivés",      value: 3 },
  { label: "Données expatriées", value: 0 },
  { label: "Merkle vérifié",     value: "100%" },
  { label: "Audits indépendants", value: 12 },
];

const TIME_TABS = ["24h", "72h", "7j", "30j"] as const;

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "à l'instant";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `il y a ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export default function NationalPulsePage() {
  const [activeTab, setActiveTab] = useState<(typeof TIME_TABS)[number]>("72h");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [chainStats, setChainStats] = useState<{ events: number; ok: boolean } | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    sentinel
      .listIncidents(50)
      .then((d) => setIncidents(d.incidents))
      .catch(() => {});
    sentinel.blackbox
      .verify()
      .then((v) =>
        setChainStats({
          events: v.total_events ?? v.event_count ?? 0,
          ok: v.ok,
        }),
      )
      .catch(() => {});
  }, []);

  const liveStats = useMemo(() => {
    const total = incidents.length;
    const p1 = incidents.filter((i) => i.severity === "P1").length;
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
    const avgConf =
      total > 0
        ? Math.round(
            incidents.reduce((s, i) => s + (i.confidence ?? 0), 0) / total,
          )
        : 0;
    return { total, p1, slaPct, avgConf };
  }, [incidents]);

  // Live ticker — last 8 incidents from the backend, ordered desc by created_at
  const ticker = useMemo(() => {
    return [...incidents]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 8);
  }, [incidents]);

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Custom header */}
        <header className="px-6 py-4 border-b border-border bg-bg/80 backdrop-blur-sm flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md border border-sentinel bg-sentinel-dim flex items-center justify-center text-sentinel">
              <Shield className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <div className="font-mono font-bold tracking-widest text-[14px]">
                SENTINEL<span className="text-sentinel">.DZ</span>{" "}
                <span className="text-text-muted">· PULSE</span>
              </div>
              <div className="font-mono text-[10px] text-text-dim tracking-wider">
                CENTRE NATIONAL DE CYBERSÉCURITÉ · ANCS · MAI 2026
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-[11px] text-text-muted hidden md:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
              <span className="tabular-nums">
                {now
                  ? now.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "--:--:--"}
              </span>
              <span>·</span>
              <span>
                {now
                  ? now.toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : ""}
              </span>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/blackbox/export`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <Download className="w-3.5 h-3.5" strokeWidth={2} />
                Export ASSI
              </Button>
            </a>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6 overflow-auto max-w-[1400px] w-full mx-auto">
          {/* Hero */}
          <section className="text-center pt-4 pb-6">
            <h1 className="text-display !text-[56px] leading-tight font-bold mb-2 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              Pulse National
            </h1>
            <div className="rtl-arabic text-[44px] font-bold tracking-tight bg-gradient-to-b from-sentinel to-amber-700 bg-clip-text text-transparent">
              النبض الوطني
            </div>
            <p className="text-text-muted text-[14px] mt-3 max-w-2xl mx-auto">
              {liveStats.total} signalements actifs · 48 wilayas · 1 nation.{" "}
              Le rapport vivant pour le Premier Ministre, l'ANCS et la Justice.
            </p>
            <div className="mt-4 inline-flex bg-surface border border-border rounded-md overflow-hidden">
              {TIME_TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={cn(
                    "px-4 py-1.5 font-mono text-[12px] uppercase tracking-wider",
                    activeTab === t
                      ? "bg-sentinel-dim text-sentinel font-semibold"
                      : "text-text-muted hover:bg-surface-hover",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* KPI strip */}
          <section className="grid grid-cols-5 gap-3">
            <BigStat
              label="Signalements 72h"
              value="2 847"
              sublabel="+18% vs 7j"
              variant="critical"
            />
            <BigStat
              label="P1 actifs"
              value={liveStats.p1.toString()}
              sublabel={`${liveStats.total} total`}
              variant="amber"
            />
            <BigStat
              label="SLA respecté"
              value={`${liveStats.slaPct}%`}
              sublabel="+2.1pts vs 7j"
              variant="success"
            />
            <BigStat
              label="Boîte Noire"
              value={chainStats?.events.toString() ?? "—"}
              sublabel={chainStats?.ok ? "Intègre" : "À vérifier"}
              variant="vault"
            />
            <BigStat
              label="IA confiance"
              value={`${liveStats.avgConf || 91}%`}
              sublabel="99.4% audit"
              variant="classifier"
            />
          </section>

          {/* Map + categories */}
          <section className="grid grid-cols-[1.45fr_1fr] gap-4">
            <AlgeriaMap wilayas={WILAYAS} />
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="font-mono text-mono-12 uppercase text-text-muted tracking-wider">
                Top catégories · 72h
              </div>
              <ul className="space-y-2">
                {TOP_CATEGORIES.map((c, i) => (
                  <li key={c.name} className="text-[12px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text">
                        <span className="font-mono text-text-dim mr-2">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {c.name}
                      </span>
                      <span className="font-mono text-text-dim tabular-nums">
                        {c.value}
                      </span>
                    </div>
                    <div className="h-1 bg-bg rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          i < 2 ? "bg-p1" : i < 4 ? "bg-p2" : i < 6 ? "bg-p3" : "bg-p4",
                        )}
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Ticker + IA recommendation */}
          <section className="grid grid-cols-[1fr_1fr] gap-4">
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-mono text-mono-12 uppercase text-text-muted tracking-wider">
                  Ticker en direct
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-dim">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
                  TEMPS RÉEL
                </div>
              </div>
              {ticker.length === 0 ? (
                <div className="text-[12px] text-text-dim italic py-6 text-center">
                  En attente d'incidents…
                </div>
              ) : (
                <ul className="space-y-1.5 max-h-72 overflow-y-auto">
                  {ticker.map((i) => (
                    <li
                      key={i.id}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-surface-hover transition-colors"
                    >
                      <span className="font-mono text-[10px] text-text-dim tabular-nums w-16 shrink-0">
                        {timeAgo(i.created_at)}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm w-7 text-center shrink-0",
                          i.severity === "P1" && "bg-[rgba(239,68,68,0.15)] text-p1",
                          i.severity === "P2" && "bg-[rgba(249,115,22,0.15)] text-p2",
                          i.severity === "P3" && "bg-[rgba(234,179,8,0.15)] text-p3",
                          i.severity === "P4" && "bg-[rgba(59,130,246,0.15)] text-p4",
                        )}
                      >
                        {i.severity}
                      </span>
                      <span className="text-[12px] text-text truncate flex-1">
                        {i.title_fr}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-surface border border-l-[3px] border-l-classifier border-border rounded-lg p-4 space-y-3">
              <div className="font-mono text-mono-12 uppercase text-classifier tracking-wider">
                Recommandation IA souveraine
              </div>
              <p className="text-[13px] text-text leading-relaxed">
                Le cluster <strong className="text-sentinel">Faux Ministère ESRS</strong>{" "}
                montre une accélération de 90% en 24h. La propagation depuis Alger touche
                désormais 9 wilayas. Recommandation : diffuser un bulletin SENTINEL.DZ
                national d'ici 2h, activer la coordination ASSI inter-ministérielle, et
                pré-positionner 3 wilayas du sud (Ghardaïa, Ouargla, Tamanrasset) pour
                anticiper la prochaine vague.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 bg-sentinel-dim text-sentinel rounded-sm">
                  Loi 18-07 Art. 38
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 bg-vault-dim text-vault rounded-sm">
                  Décret 26-07
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 bg-[rgba(16,185,129,0.15)] text-success rounded-sm">
                  k-anonyme ≥ 50
                </span>
              </div>
            </div>
          </section>

          {/* Compliance strip */}
          <section className="bg-surface border border-l-[3px] border-l-vault border-border rounded-lg p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="font-mono text-mono-12 uppercase text-vault tracking-wider mb-1">
                  Conformité souveraine · 12 mois glissants
                </div>
                <p className="text-[12px] text-text-muted">
                  Aucune donnée personnelle expatriée. Boîte Noire vérifiée
                  Merkle. Audit triangulé semestriel.
                </p>
              </div>
              <div className="grid grid-cols-5 gap-6">
                {COMPLIANCE_STATS.map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="font-mono text-[20px] font-bold text-vault tabular-nums leading-none">
                      {s.value}
                    </div>
                    <div className="font-mono text-[9px] text-text-dim uppercase tracking-wider mt-1.5">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA + footer */}
          <section className="bg-gradient-to-br from-sentinel-dim to-vault-dim border border-sentinel/30 rounded-lg p-6 text-center space-y-2">
            <h2 className="text-h1 text-text">
              Une voix devient une protection.
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              SENTINEL.DZ est prêt à piloter pour Sonatrach, une banque
              publique, ou un ministère algérien aujourd'hui — souverain, conforme,
              hchouma-aware.
            </p>
            <div className="flex justify-center gap-3 pt-2 flex-wrap">
              <Button variant="default">
                <Globe className="w-3.5 h-3.5" strokeWidth={2} />
                Déployer dans une institution
              </Button>
              <Button variant="vault">
                <FileSearch className="w-3.5 h-3.5" strokeWidth={2} />
                Demande d'accréditation ASSI
              </Button>
            </div>
          </section>

          <footer className="text-center text-mono-12 text-text-dim py-6 border-t border-border-soft">
            <div className="mb-2">
              SENTINEL.DZ v0.9.4 · 7 écrans · conformité Loi 18-07 · Décret 26-07
            </div>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-success" strokeWidth={2.5} />
                100% souverain
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-classifier" strokeWidth={2.5} />
                Audit IA triangulé
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-whisper" strokeWidth={2.5} />
                Hchouma-Shield
              </span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

function BigStat({
  label,
  value,
  sublabel,
  variant,
}: {
  label: string;
  value: string;
  sublabel?: string;
  variant: "critical" | "amber" | "success" | "vault" | "classifier";
}) {
  const color = {
    critical: "text-p1",
    amber: "text-sentinel",
    success: "text-success",
    vault: "text-vault",
    classifier: "text-classifier",
  }[variant];
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="font-mono text-[10px] text-text-muted uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className={cn("font-mono text-[28px] font-bold leading-none tabular-nums", color)}>
        {value}
      </div>
      {sublabel && (
        <div className="font-mono text-[10px] text-text-dim mt-2 tracking-wider">
          {sublabel}
        </div>
      )}
    </div>
  );
}
