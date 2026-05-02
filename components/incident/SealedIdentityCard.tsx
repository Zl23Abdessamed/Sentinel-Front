"use client";

import { useEffect, useState } from "react";
import { Lock, Unlock, EyeOff } from "lucide-react";
import { sentinel, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Hchouma-Shield 2-of-3 unlock UI. Reveals the raw reporter ID only when two
// distinct approver roles (RSSI / DPO / RH) have voted. Whisper Mode incidents
// are sealed forever — the early return short-circuits the whole flow.

interface SealedIdentityCardProps {
  incidentId: string;
  isWhisper: boolean;
  className?: string;
}

interface UnlockState {
  exists: boolean;
  approvers_count?: number;
  min_approvers?: number;
}

export function SealedIdentityCard({
  incidentId,
  isWhisper,
  className,
}: SealedIdentityCardProps) {
  const [state, setState] = useState<UnlockState>({ exists: false });
  const [revealed, setRevealed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requesterId] = useState(
    () => "rssi-" + Math.random().toString(36).slice(2, 8),
  );

  const refresh = async () => {
    if (isWhisper) return;
    try {
      const s = await sentinel.unlock.state(incidentId);
      setState(s);
    } catch {
      setState({ exists: false });
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  if (isWhisper) {
    return (
      <div
        className={cn(
          "bg-surface border border-l-[3px] border-l-whisper border-border rounded-lg p-4 space-y-2",
          className,
        )}
      >
        <div className="flex items-center gap-2 text-whisper">
          <EyeOff className="w-4 h-4" strokeWidth={2} />
          <span className="font-semibold text-[13px]">
            Identité scellée à perpétuité
          </span>
        </div>
        <p className="text-[12px] text-text-muted">
          Mode Murmure : aucun déverrouillage n'est possible. C'est la garantie
          de protection du signaleur.
        </p>
      </div>
    );
  }

  const requestUnlock = async () => {
    setBusy(true);
    setError(null);
    try {
      await sentinel.unlock.request(
        incidentId,
        requesterId,
        "Investigation incident · responder",
      );
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const approve = async (role: "RSSI" | "DPO" | "HR_HEAD") => {
    setBusy(true);
    setError(null);
    try {
      const r = await sentinel.unlock.approve(
        incidentId,
        `${role.toLowerCase()}-${Date.now()}`,
        role,
      );
      if (r.approved && r.reporter_id_raw) {
        setRevealed(r.reporter_id_raw);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? `${e.status} ${e.message}` : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (revealed) {
    return (
      <div
        className={cn(
          "bg-surface border border-l-[3px] border-l-success border-border rounded-lg p-4 space-y-2",
          className,
        )}
      >
        <div className="flex items-center gap-2 text-success">
          <Unlock className="w-4 h-4" strokeWidth={2} />
          <span className="font-semibold text-[13px]">Identité révélée</span>
        </div>
        <div className="bg-surface-2 px-3 py-2 rounded-md font-mono text-[12px] text-text break-all">
          {revealed}
        </div>
        <p className="text-[11px] text-text-dim italic">
          Usage strictement réservé aux deux approbateurs. Toute consultation
          est tracée dans la Boîte Noire (action <span className="font-mono">UNLOCK_APPROVED</span>).
        </p>
      </div>
    );
  }

  if (state.exists) {
    const count = state.approvers_count ?? 0;
    const min = state.min_approvers ?? 2;
    const pct = Math.min(100, (count / min) * 100);
    return (
      <div
        className={cn(
          "bg-surface border border-border rounded-lg p-4 space-y-3",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-text-muted" strokeWidth={2} />
          <span className="font-semibold text-[13px]">
            Identité scellée · déverrouillage en cours
          </span>
        </div>
        <div>
          <div className="flex justify-between text-[12px] mb-1.5">
            <span className="text-text-muted">
              {count} / {min} approbations reçues
            </span>
            <span className="font-mono text-text-dim">
              {Math.round(pct)}%
            </span>
          </div>
          <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-sentinel transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" variant="outline" onClick={() => approve("RSSI")} disabled={busy}>
            RSSI
          </Button>
          <Button size="sm" variant="outline" onClick={() => approve("DPO")} disabled={busy}>
            DPO
          </Button>
          <Button size="sm" variant="outline" onClick={() => approve("HR_HEAD")} disabled={busy}>
            RH
          </Button>
        </div>
        {error && (
          <div className="text-[11px] text-p1 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] px-2 py-1.5 rounded-md">
            {error}
          </div>
        )}
        <p className="text-[10px] text-text-dim italic">
          Deux rôles distincts doivent valider. Aucun seul rôle ne peut révéler
          l'identité d'un signaleur.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-lg p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-text-muted" strokeWidth={2} />
        <span className="font-semibold text-[13px]">Identité scellée</span>
      </div>
      <p className="text-[12px] text-text-muted">
        Déverrouillage 2-sur-3 requis (RSSI · DPO · RH). Toute demande est
        tracée dans la Boîte Noire.
      </p>
      <Button variant="outline" size="sm" onClick={requestUnlock} disabled={busy}>
        Demander le déverrouillage
      </Button>
      {error && (
        <div className="text-[11px] text-p1 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] px-2 py-1.5 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
