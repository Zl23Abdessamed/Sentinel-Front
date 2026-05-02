import { Check, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import type { Severity } from "@/lib/api";
import { cn } from "@/lib/utils";

// Slides in below the transcription. Severity-tagged left border, bilingual
// title + summary (Arabic collapses by default), reassurance line in green,
// tool-call summary footer + grace-period chip when applicable.

interface AIResultCardProps {
  incidentId: string;
  category: string;
  severity: Severity;
  titleFr: string;
  titleAr: string;
  summaryFr: string;
  summaryAr: string;
  toolsUsed?: number;
  graceFlag?: boolean;
  matchedCampaign?: string;
  className?: string;
}

const REASSURANCE = "Tu n'es pas en faute. L'équipe sécurité prend le relais.";

export function AIResultCard({
  incidentId,
  category,
  severity,
  titleFr,
  titleAr,
  summaryFr,
  summaryAr,
  toolsUsed = 4,
  graceFlag,
  matchedCampaign,
  className,
}: AIResultCardProps) {
  return (
    <Card
      variant="severity"
      severity={severity}
      className={cn("animate-bubble-in", className)}
    >
      <CardHeader className="!mb-3 !flex-row items-center gap-2 flex-wrap">
        <SeverityBadge level={severity} />
        <span className="text-mono-12 text-text-muted">{category}</span>
        <span className="font-mono text-[12px] font-semibold text-sentinel ml-auto tracking-wider">
          {incidentId}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="font-semibold text-text">{titleFr}</div>
        <div className="rtl-arabic text-[15px] text-text-muted">{titleAr}</div>
        <p className="text-text-muted text-[13px] leading-relaxed">
          {summaryFr}
        </p>
        <details className="group">
          <summary className="text-mono-12 text-text-dim cursor-pointer hover:text-text-muted uppercase tracking-wider list-none">
            ▸ Résumé arabe
          </summary>
          <p className="rtl-arabic text-[15px] text-text-muted mt-2 leading-[1.7]">
            {summaryAr}
          </p>
        </details>
        {matchedCampaign && (
          <div className="text-[12px] bg-surface-2 px-3 py-2 rounded-md">
            <span className="font-mono text-[10px] text-sentinel uppercase tracking-wider mr-2">
              CAMPAGNE
            </span>
            <span className="text-text">{matchedCampaign}</span>
          </div>
        )}
        <div className="bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)] rounded-md px-3 py-2 italic text-[13px] text-success">
          {REASSURANCE}
        </div>
      </CardContent>
      <CardFooter className="!mt-4 flex items-center gap-3 text-mono-12 flex-wrap">
        <span className="flex items-center gap-1.5 text-text-muted">
          <ShieldCheck
            className="w-3.5 h-3.5 text-classifier"
            strokeWidth={2}
          />
          <span>{toolsUsed} outils consultés</span>
          <Check className="w-3.5 h-3.5 text-success" strokeWidth={2.5} />
        </span>
        {graceFlag && (
          <span className="flex items-center gap-1.5 text-success">
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Délai de grâce respecté</span>
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
