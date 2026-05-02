"use client";

import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { sentinel, apiBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChainIntegrityBadge } from "./ChainIntegrityBadge";
import { cn } from "@/lib/utils";

// "Export ASSI · Magistrat" panel. Verify hits /api/blackbox/verify and
// renders the integrity badge inline; download links straight to the export
// endpoint so the browser handles the file save with the backend's
// Content-Disposition header.

interface ExportPanelProps {
  className?: string;
}

interface VerifyResult {
  ok: boolean;
  eventCount: number;
  verifiedAt: string;
}

export function ExportPanel({ className }: ExportPanelProps) {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const verify = async () => {
    setVerifying(true);
    try {
      const r = await sentinel.blackbox.verify();
      setResult({
        ok: r.ok,
        eventCount: r.total_events ?? r.event_count ?? 0,
        verifiedAt: new Date().toISOString(),
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className={cn(
        "bg-surface border border-l-[3px] border-l-vault border-border rounded-lg p-4 space-y-3 w-full",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="font-mono text-mono-12 uppercase text-vault tracking-wider">
          Export ASSI · Magistrat
        </div>
        {result && (
          <ChainIntegrityBadge
            ok={result.ok}
            eventCount={result.eventCount}
          />
        )}
      </div>
      <p className="text-[12px] text-text-muted">
        Export conforme au format <strong className="text-text">ASSI-1.0</strong>{" "}
        pour transmission aux autorités algériennes (CNDP, ANCS, magistrat).
        Inclut chaque incident, sa chaîne d'audit complète et le hash genesis.
      </p>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={verify}
          disabled={verifying}
        >
          <RefreshCw
            className={cn("w-3.5 h-3.5", verifying && "animate-spin")}
            strokeWidth={2}
          />
          {verifying ? "Vérification..." : "Vérifier l'intégrité"}
        </Button>
        <a
          href={`${apiBaseUrl}/api/blackbox/export`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <Button variant="vault" size="sm">
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Télécharger l'export
          </Button>
        </a>
      </div>
      {result && (
        <div className="text-[11px] font-mono text-text-dim">
          Vérifiée le{" "}
          {new Date(result.verifiedAt).toLocaleString("fr-FR")}
        </div>
      )}
    </div>
  );
}
