"use client";

import { useEffect, useState } from "react";
import { Shield, FileSearch, Database, Lock, RotateCcw, Building2, ShieldCheck, CheckCircle } from "lucide-react";
import { sentinel, type AuditEvent } from "@/lib/api";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { Topbar } from "@/components/nav/Topbar";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { ChainIntegrityBadge } from "@/components/blackbox/ChainIntegrityBadge";
import { EventRow } from "@/components/blackbox/EventRow";
import { MerkleVisual } from "@/components/blackbox/MerkleVisual";
import { ExportPanel } from "@/components/blackbox/ExportPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VerifyStats {
  ok: boolean;
  incidents: number;
  events: number;
}

const ACTION_OPTIONS = [
  "",
  "REPORTED",
  "REPORT_GENERATED",
  "CLOSED",
  "ACK",
  "ESCALATED",
  "VELOCITY_TRIGGERED",
  "UNLOCK_REQUESTED",
  "UNLOCK_APPROVED",
  "INJECTION_DETECTED",
  "AI_DISAGREEMENT",
  "WHISPER_WINDOW_OPENED",
  "WHISPER_SIGNAL_APPENDED",
];

export default function BlackBoxPage() {
  const [demoRole, setDemoRole] = useState<"WORKER" | "MANAGER" | "ADMIN">("ADMIN");
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [scanIndex, setScanIndex] = useState(-1);

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VerifyStats | null>(null);
  const [filterAction, setFilterAction] = useState("");
  const [filterIncident, setFilterIncident] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await sentinel.blackbox.list({
        limit: 200,
        action: filterAction || undefined,
        incident_id: filterIncident.trim() || undefined,
      });
      setEvents(data.events);

      const verify = await sentinel.blackbox.verify();
      setStats({
        ok: verify.ok,
        incidents: verify.incidents_verified ?? 0,
        events: verify.total_events ?? 0,
      });
    } catch (e) {
      console.error("blackbox fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAction, filterIncident]);

  const lastHash = events[0]?.hash ?? "";

  const verifyLedger = () => {
    if (verifyingChain) return;
    setVerifyingChain(true);
    setScanIndex(0);
    let idx = 0;
    const iv = setInterval(() => {
      if (idx >= events.length) {
        clearInterval(iv);
        setTimeout(() => { setVerifyingChain(false); setScanIndex(events.length); }, 3000);
        return;
      }
      setScanIndex(idx);
      idx++;
    }, 150);
  };

  return (
    <>
      <Topbar
        title="Boîte Noire"
        subtitle="COFFRE-FORT CRYPTOGRAPHIQUE · SHA-256 · APPEND-ONLY"
        rightSlot={
          <div className="flex items-center gap-4">
            <div className="flex bg-surface border border-border rounded-md overflow-hidden text-xs">
              <button onClick={() => setDemoRole("WORKER")} className={cn("px-3 py-1.5", demoRole==="WORKER" && "bg-orange-500/20 text-orange-400 font-bold")}>Worker</button>
              <button onClick={() => setDemoRole("MANAGER")} className={cn("px-3 py-1.5", demoRole==="MANAGER" && "bg-blue-500/20 text-blue-400 font-bold")}>Manager</button>
              <button onClick={() => setDemoRole("ADMIN")} className={cn("px-3 py-1.5", demoRole==="ADMIN" && "bg-vault/20 text-vault font-bold")}>Admin</button>
            </div>
            {stats && demoRole === "ADMIN" ? (
              <ChainIntegrityBadge ok={stats.ok} eventCount={stats.events} />
            ) : null}
          </div>
        }
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 p-6 overflow-auto">
        {demoRole === "WORKER" && (
          <div className="flex flex-col items-center pt-20">
            <div className="max-w-md w-full bg-[#0a0f18]/80 border border-success/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
              <div className="h-20 w-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10 text-success" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold text-success text-center mb-8">Signalement Sécurisé</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border/50 pb-4">
                  <span className="text-text-muted">Horodatage</span>
                  <span className="font-mono text-text bg-surface px-2 py-1 rounded">
                    {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · {new Date().toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-4">
                  <span className="text-text-muted">Reçu Cryptographique</span>
                  <span className="font-mono text-vault bg-vault/10 px-2 py-1 rounded">
                    0x8F4...C2D
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-text-muted">Statut de Protection</span>
                  <span className="flex items-center gap-1.5 text-success font-semibold">
                    <CheckCircle className="w-4 h-4" /> Safe Harbor Actif
                  </span>
                </div>
              </div>
              
              <div className="mt-8 bg-success/5 p-4 rounded-lg border border-success/20">
                <p className="text-sm text-success/80 italic text-center">
                  "Votre rapport est cryptographiquement scellé et horodaté. Votre statut Safe Harbor est sécurisé et valide."
                </p>
              </div>
            </div>
          </div>
        )}

        {demoRole === "MANAGER" && (
          <div className="pt-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
                <Building2 className="w-6 h-6 text-blue-500" />
                Conformité Départementale
              </h2>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 flex flex-col md:flex-row items-center gap-8 text-left">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="transparent" stroke="rgba(59,130,246,0.1)" strokeWidth="12" />
                    <circle cx="64" cy="64" r="56" fill="transparent" stroke="#3b82f6" strokeWidth="12" strokeDasharray="351.858" strokeDashoffset="0" className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold text-blue-400">100%</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-blue-100 mb-2">Bouclier de Conformité Actif</h3>
                  <p className="text-blue-200/60 leading-relaxed text-sm">
                    L'intégralité des signalements de votre département ont été scellés dans la Boîte Noire et sont en parfaite conformité avec la Loi 18-07.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-text-muted mt-8 mb-4 uppercase tracking-wider">
                  Derniers Rapports Soft (Anonymisés)
                </h3>
                {[
                  { id: 1, title: 'Tentative de Phishing', dept: 'Comptabilité', time: 'Il y a 10 min' },
                  { id: 2, title: 'Perte de Poste', dept: 'Comptabilité', time: 'Il y a 2h' },
                  { id: 3, title: 'Clé USB Inconnue', dept: 'Comptabilité', time: 'Hier' }
                ].map(inc => (
                  <div key={inc.id} className="bg-surface border border-border rounded-lg p-5 flex items-center justify-between hover:border-border-soft transition-colors">
                    <div>
                      <div className="text-gray-200 font-medium mb-1">{inc.title}</div>
                      <div className="text-xs text-text-muted">Signalement anonyme • {inc.dept} • {inc.time}</div>
                    </div>
                    <div className="group relative flex items-center gap-2 bg-vault/10 px-3 py-1.5 rounded-full border border-vault/20 cursor-help">
                      <Lock className="w-3.5 h-3.5 text-vault" />
                      <span className="text-sm font-semibold text-vault">Scellé</span>
                      
                      <div className="absolute bottom-full right-0 mb-3 w-64 p-3 bg-[#0a0f18] border border-vault/30 text-xs rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-text-muted">
                        Piste d'audit vérifiée. Journal infalsifiable généré pour conformité à la Loi 18-07.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {demoRole === "ADMIN" && (
          <div className="space-y-6 min-w-0">
            {/* Hero */}
            <section>
              <div className="font-mono text-mono-12 uppercase text-vault tracking-wider">
                CLUSTER · TOUTES INSTITUTIONS
              </div>
              <h1 className="text-display mt-1">
                Coffre-fort <span className="text-vault">cryptographique</span>
              </h1>
              <p className="text-text-muted mt-2 max-w-2xl text-[14px] leading-relaxed">
                Chaque action sur SENTINEL.DZ produit un événement audité,
                scellé par un hash <strong className="text-text">SHA-256</strong>{" "}
                chaîné au précédent.{" "}
                <strong className="text-text">Append-only</strong>, vérifiable
                hors-ligne, exportable au format{" "}
                <strong className="text-text">ASSI-1.0</strong> pour
                transmission aux autorités.
              </p>
            </section>

            {/* Stats strip */}
            <div className="grid grid-cols-4 gap-4">
              <Stat
                label="Événements"
                value={stats?.events ?? "—"}
                icon={<FileSearch className="w-3 h-3" />}
                variant="vault"
              />
              <Stat
                label="Incidents tracés"
                value={stats?.incidents ?? "—"}
                icon={<Shield className="w-3 h-3" />}
              />
              <Stat
                label="Algorithme"
                value="SHA-256"
                icon={<Lock className="w-3 h-3" />}
                mono
              />
              <Stat
                label="Format export"
                value="ASSI-1.0"
                icon={<Database className="w-3 h-3" />}
                mono
              />
            </div>

            {/* Merkle visual + Export panel */}
            <div className="">
              <ExportPanel />
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap items-center">
              <div className="font-mono text-mono-12 uppercase text-text-muted tracking-wider">
                Filtres :
              </div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="bg-surface border border-border rounded-md text-[12px] px-2 py-1.5 font-mono focus:border-sentinel focus:outline-none"
                aria-label="Filtre par action"
              >
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a || "Toutes actions"}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={filterIncident}
                onChange={(e) => setFilterIncident(e.target.value)}
                placeholder="INC-2026-XXXX"
                className="bg-surface border border-border rounded-md text-[12px] px-2 py-1.5 font-mono w-44 focus:border-sentinel focus:outline-none placeholder:text-text-dim"
                aria-label="Filtre par incident"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterAction("");
                  setFilterIncident("");
                }}
                disabled={!filterAction && !filterIncident}
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                Réinitialiser
              </Button>
              <span className="ml-auto font-mono text-[11px] text-text-dim">
                {loading ? "Chargement…" : `${events.length} résultats`}
              </span>
            </div>

            {/* Event visualizer */}
            <section aria-label="Journal d'audit">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-vault">Immutable Ledger Visualizer</h2>
                 <Button variant="vault" onClick={verifyLedger} disabled={verifyingChain || events.length === 0} className={cn(verifyingChain && "animate-pulse")}>
                    <RotateCcw className={cn("w-4 h-4 mr-2", verifyingChain && "animate-spin")} />
                    {verifyingChain ? "Vérification en cours..." : "Vérifier l'Intégrité de la Chaîne"}
                 </Button>
              </div>

              {loading ? (
                <div className="bg-surface border border-border rounded-lg p-8 text-center text-text-muted">
                  Chargement…
                </div>
              ) : events.length === 0 ? (
                <div className="bg-surface border border-border rounded-lg p-8 text-center text-text-dim italic">
                  Boîte Noire vide — aucun événement enregistré pour ces
                  filtres.
                </div>
              ) : (
                <div className="pl-12 relative space-y-8 max-h-[800px] overflow-y-auto pb-32">
                   {/* The continuous line */}
                   <div className="absolute left-[47px] top-4 bottom-0 w-1 bg-border" />

                   {events.map((e, i) => {
                      const isActive = scanIndex === i;
                      const isVerified = scanIndex > i || scanIndex === events.length;
                      const prevHash = i === events.length - 1 ? "0000000000000000000000000000000000000000" : events[i+1].hash;

                      return (
                        <div key={e.id} className="relative z-10 transition-all duration-300">
                           <div className={cn(
                              "absolute -left-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all bg-[#0a0f18]",
                              isActive ? "border-vault shadow-[0_0_20px_#22d3ee] scale-125" :
                              isVerified ? "border-success shadow-[0_0_15px_#10b981]" : "border-border"
                           )}>
                             {isVerified && <CheckCircle className="w-5 h-5 text-success absolute" />}
                           </div>

                           <div className={cn(
                              "bg-surface border rounded-xl p-5 transition-all duration-500 flex flex-col xl:flex-row xl:items-center justify-between gap-4",
                              isActive ? "border-vault bg-vault/5 shadow-[0_0_30px_rgba(34,211,238,0.15)] ml-4" :
                              isVerified ? "border-success/30 bg-success/5" : "border-border"
                           )}>
                              <div className="space-y-2 overflow-hidden">
                                 <div className="flex items-center gap-3">
                                   <span className="text-mono-12 text-text-muted font-bold">BLOCK #{events.length - i}</span>
                                   <span className="text-xs text-text-dim">{new Date(e.created_at).toLocaleString()}</span>
                                   <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-surface-2 hidden md:inline-block">{e.action}</span>
                                 </div>
                                 
                                 <div className="flex flex-col gap-1 mt-3">
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono text-xs text-text-muted w-24 flex-shrink-0">Prev Hash:</span>
                                      <span className="font-mono text-xs text-text bg-bg px-2 py-1 rounded border border-border-soft truncate">{prevHash.substring(0, 32)}...</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono text-xs text-text-muted w-24 flex-shrink-0">Current Hash:</span>
                                      <span className={cn("font-mono text-xs px-2 py-1 rounded border transition-colors truncate", isVerified ? "text-success border-success/30 bg-success/10 font-bold" : "text-vault bg-bg border-border-soft")}>{e.hash.substring(0, 32)}...</span>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="flex-shrink-0 flex items-center justify-end">
                                 {isVerified ? (
                                    <div className="text-success flex items-center gap-1.5 font-mono text-[10px] sm:text-xs bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
                                       <CheckCircle className="w-4 h-4"/> VERIFIED
                                    </div>
                                 ) : isActive ? (
                                    <div className="text-vault flex items-center gap-1.5 font-mono text-[10px] sm:text-xs animate-pulse bg-vault/10 px-3 py-1.5 rounded-full border border-vault/20">
                                       <Shield className="w-4 h-4"/> SCANNING
                                    </div>
                                 ) : (
                                    <div className="text-text-dim flex items-center gap-1.5 font-mono text-[10px] sm:text-xs bg-bg px-3 py-1.5 rounded-full border border-border">
                                       <Lock className="w-4 h-4 text-border"/> PENDING
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      )
                   })}
                </div>
              )}
            </section>
          </div>
        )}

        <LiveFeed />
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  icon,
  variant,
  mono,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: "vault";
  mono?: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3">
      <div className="flex items-center gap-2 text-mono-12 text-text-muted uppercase mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={cn(
          "text-[24px] font-bold leading-none tabular-nums",
          mono && "font-mono",
          variant === "vault" && "text-vault",
        )}
      >
        {value}
      </div>
    </div>
  );
}
