"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Lock } from "lucide-react";
import { sentinel, type IntakeResponse, type IncidentCategory } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ArsAvatar } from "@/components/shared/ArsAvatar";
import { MessageBubble } from "@/components/ars/MessageBubble";
import { MicButton } from "@/components/ars/MicButton";
import { Waveform } from "@/components/ars/Waveform";
import {
  ThreeColumnTranscription,
  type TranscriptionStage,
} from "@/components/ars/ThreeColumnTranscription";
import { AIResultCard } from "@/components/ars/AIResultCard";
import { SmartPromptButtons } from "@/components/ars/SmartPromptButtons";
import { Topbar } from "@/components/nav/Topbar";

type AppStage = "idle" | "listening" | "processing" | "confirm" | "done";

// Demo Darija line — matches backend's transcript_demo_darija.txt exactly so
// the canned voice path produces the same on-screen text as a real Whisper run.
const DEMO_DARIJA =
  "Hadi sba7 daghya cliquit 3la lien jani men l-ministère, w daba browser tabla7 w ma 3andich m'a ndir.";
const DEMO_FR =
  "Ce matin j'ai cliqué rapidement sur un lien venant du ministère, et maintenant le navigateur se comporte étrangement et je ne sais pas quoi faire.";
const DEMO_AR =
  "هذا الصباح ضغطت بسرعة على رابط جاءني من الوزارة، والآن المتصفح يتصرف بشكل غريب ولا أعرف ماذا أفعل.";

type Message =
  | { kind: "ars-text"; id: string; text: string; ts: string }
  | { kind: "user-text"; id: string; text: string; ts: string }
  | { kind: "user-voice"; id: string; duration: string; ts: string }
  | { kind: "transcription"; id: string; stage: TranscriptionStage }
  | { kind: "ai-result"; id: string; result: IntakeResponse }
  | { kind: "smart-prompt"; id: string; question: string }
  | { kind: "typing"; id: string };

function tsNow() {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  PHISHING: "Phishing — compromission de credentials",
  LOST_DEVICE: "Perte ou vol d'appareil",
  RANSOMWARE: "Ransomware",
  CREDENTIAL_LEAK: "Fuite d'identifiants",
  SUSPICIOUS_LOGIN: "Connexion suspecte",
  ACCOUNT_TAKEOVER: "Prise de contrôle de compte",
  MALWARE: "Malware",
  BUSINESS_EMAIL_COMPROMISE: "Business Email Compromise",
  WHISPER: "Mode Murmure",
  OTHER: "À clarifier",
};

export default function IntakePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      kind: "ars-text",
      id: "init-1",
      ts: tsNow(),
      text:
        "Salam Amel. Je suis ARS, ton agent de réponse sécurité. Décris-moi ce qui se passe — par voix ou par texte. Tu peux rester anonyme.",
    },
  ]);
  const [anonymous, setAnonymous] = useState(true);
  const [composing, setComposing] = useState("");
  const [busy, setBusy] = useState(false);
  const [graceOpenedAt] = useState(() => new Date().toISOString());
  const reporterIdRef = useRef<string>("anon");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<AppStage>("idle");

  // Generate a stable session id once on mount (avoids hydration mismatch).
  useEffect(() => {
    reporterIdRef.current =
      typeof window !== "undefined" && window.crypto?.randomUUID
        ? "web-" + window.crypto.randomUUID()
        : "web-" + Math.random().toString(36).slice(2);
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const append = (msg: Message) => setMessages((m) => [...m, msg]);
  const replaceMsg = (id: string, msg: Message) =>
    setMessages((m) => m.map((x) => (x.id === id ? msg : x)));
  const updateStage = (id: string, stage: TranscriptionStage) =>
    setMessages((m) =>
      m.map((x) =>
        x.id === id && x.kind === "transcription" ? { ...x, stage } : x,
      ),
    );

  // Voice flow — works whether Blob is real audio or null (mic denied).
  // The visible UI uses canned demo transcripts; if a Blob exists we still
  // POST it to /api/transcribe so the backend logs/audits the real recording.
  async function handleAudio(blob: Blob | null) {
    if (busy) return;
    setBusy(true);

    append({
      kind: "user-voice",
      id: "uv-" + Date.now(),
      duration: "0:08",
      ts: tsNow(),
    });

    const typingId = "typing-" + Date.now();
    setTimeout(() => append({ kind: "typing", id: typingId }), 250);

    const transcId = "trans-" + Date.now();
    setTimeout(() => {
      replaceMsg(typingId, {
        kind: "transcription",
        id: transcId,
        stage: "darija-streaming",
      });
    }, 700);

    // Sequence stages by character count + pacing used by useStreamedText.
    const totalDarijaMs = DEMO_DARIJA.length * 22 + 200;
    const totalFrMs = DEMO_FR.length * 24 + 200;
    setTimeout(
      () => updateStage(transcId, "fr-streaming"),
      700 + totalDarijaMs,
    );
    setTimeout(
      () => updateStage(transcId, "ar-streaming"),
      700 + totalDarijaMs + totalFrMs,
    );

    // Fire backend intake in parallel (uses canned phishing fallback if no Groq).
    if (blob) {
      sentinel.transcribe(blob, "ar").catch(() => {
        /* logged server-side; UI continues with canned text */
      });
    }
    let result: IntakeResponse | null = null;
    try {
      result = await sentinel.intake({
        text: DEMO_FR,
        reporter_id: anonymous ? "anon-" + Date.now() : reporterIdRef.current,
        channel: "WEB",
        institution: "Université d'Alger",
        department: "Comptabilité",
        raw_darija_transcript: DEMO_DARIJA,
        raw_fr_transcript: DEMO_FR,
        raw_ar_transcript: DEMO_AR,
      });
    } catch {
      setTimeout(() => {
        append({
          kind: "ars-text",
          id: "err-" + Date.now(),
          ts: tsNow(),
          text:
            "Le serveur ne répond pas. Votre signalement est sauvegardé localement — réessayez dans quelques secondes.",
        });
        setBusy(false);
      }, 700 + totalDarijaMs + totalFrMs + 1000);
      return;
    }

    const resolvedResult = result;
    setTimeout(
      () => updateStage(transcId, "complete"),
      700 + totalDarijaMs + totalFrMs + 600,
    );
    setTimeout(() => {
      append({
        kind: "ai-result",
        id: "air-" + Date.now(),
        result: resolvedResult,
      });
      if (
        resolvedResult.needs_clarification &&
        resolvedResult.clarifying_questions?.length
      ) {
        append({
          kind: "smart-prompt",
          id: "sp-" + Date.now(),
          question: resolvedResult.clarifying_questions[0],
        });
      }
      setBusy(false);
    }, 700 + totalDarijaMs + totalFrMs + 1200);
  }

  async function handleSendText() {
    const text = composing.trim();
    if (!text || busy) return;
    setComposing("");
    setBusy(true);
    append({ kind: "user-text", id: "ut-" + Date.now(), text, ts: tsNow() });

    const typingId = "typing-" + Date.now();
    setTimeout(() => append({ kind: "typing", id: typingId }), 250);

    try {
      const result = await sentinel.intake({
        text,
        reporter_id: anonymous ? "anon-" + Date.now() : reporterIdRef.current,
        channel: "WEB",
        institution: "Université d'Alger",
        department: "Comptabilité",
      });
      setTimeout(() => {
        replaceMsg(typingId, {
          kind: "ai-result",
          id: "air-" + Date.now(),
          result,
        });
        if (
          result.needs_clarification &&
          result.clarifying_questions?.length
        ) {
          append({
            kind: "smart-prompt",
            id: "sp-" + Date.now(),
            question: result.clarifying_questions[0],
          });
        }
        setBusy(false);
      }, 800);
    } catch {
      setTimeout(() => {
        replaceMsg(typingId, {
          kind: "ars-text",
          id: "err-" + Date.now(),
          ts: tsNow(),
          text:
            "Le serveur ne répond pas. Vérifiez que SENTINEL.DZ tourne sur localhost:8080.",
        });
        setBusy(false);
      }, 800);
    }
  }

  function handleSmartPromptAnswer(
    promptId: string,
    answer: "oui" | "non",
  ) {
    setMessages((m) => m.filter((x) => x.id !== promptId));
    append({
      kind: "user-text",
      id: "ut-" + Date.now(),
      text: answer === "oui" ? "Oui" : "Non",
      ts: tsNow(),
    });
    setTimeout(
      () =>
        append({
          kind: "ars-text",
          id: "ack-" + Date.now(),
          ts: tsNow(),
          text:
            answer === "oui"
              ? "Compris. La sévérité est maintenue à P2."
              : "Noté. La sévérité est revue à la baisse — équipe sécurité informée.",
        }),
      400,
    );
  }

  // 3) Show the final AI result (mocked from earlier)
  const mockResultMsg = {
    kind: "ai-result" as const,
    id: crypto.randomUUID(),
    result: {
      incident: {
        id: "mock_123",
        category: "national_security",
        severity: "high",
        title_fr: "Discussion Suspecte Détectée",
        title_ar: "تم اكتشاف نقاش مشبوه",
        summary_fr:
          "L'utilisateur a mentionné une phrase qui correspond à un mode opératoire connu.",
        summary_ar: "ذكر المستخدم جملة تتطابق مع طريقة عمل معروفة.",
        matched_campaign: null,
        grace_period_flag: false,
      },
      decision_tree_path: [],
    },
  } as any;

  function handleMockResult() {
    setMessages((prev) => [...prev, mockResultMsg]);
    setStage("done");
  };

  return (
    <div className="flex-1 flex flex-col bg-bg w-full">
      <Topbar
        title="Chat ARS"
        subtitle="Agent de Renseignement Synthétique"
        rightSlot={
          <button
            type="button"
            onClick={() => setAnonymous(!anonymous)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono uppercase tracking-wider transition-colors",
              anonymous
                ? "bg-[rgba(16,185,129,0.15)] border-success text-success"
                : "bg-surface border-border text-text-muted"
            )}
            aria-pressed={anonymous}
            aria-label={anonymous ? "Mode anonyme actif" : "Mode identifié actif"}
          >
            <Lock className="w-3 h-3" strokeWidth={2.5} />
            {anonymous ? "Anonyme" : "Identifié"}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-6 custom-scrollbar">
        <div className="max-w-[480px] mx-auto space-y-4">
          {messages.map((m) => {
            switch (m.kind) {
              case "ars-text":
                return (
                  <MessageBubble
                    key={m.id}
                    variant="ars-text"
                    timestamp={m.ts}
                  >
                    {m.text}
                  </MessageBubble>
                );
              case "user-text":
                return (
                  <MessageBubble
                    key={m.id}
                    variant="user-text"
                    timestamp={m.ts}
                  >
                    {m.text}
                  </MessageBubble>
                );
              case "user-voice":
                return (
                  <MessageBubble
                    key={m.id}
                    variant="user-voice"
                    timestamp={m.ts}
                  >
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-sentinel text-bg flex items-center justify-center"
                      aria-label="Lire la note vocale"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3 h-3"
                        fill="currentColor"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                    <Waveform />
                    <span className="font-mono text-[11px] text-text-muted">
                      {m.duration}
                    </span>
                  </MessageBubble>
                );
              case "transcription":
                return (
                  <MessageBubble key={m.id} variant="ars-rich" withAvatar={false}>
                    <ThreeColumnTranscription
                      stage={m.stage}
                      darijaTarget={DEMO_DARIJA}
                      frTarget={DEMO_FR}
                      arTarget={DEMO_AR}
                    />
                  </MessageBubble>
                );
              case "ai-result":
                return (
                  <MessageBubble key={m.id} variant="ars-rich" withAvatar={false}>
                    <AIResultCard
                      incidentId={m.result.incident.id}
                      category={
                        CATEGORY_LABELS[m.result.incident.category] ??
                        m.result.incident.category
                      }
                      severity={m.result.incident.severity}
                      titleFr={m.result.incident.title_fr}
                      titleAr={m.result.incident.title_ar}
                      summaryFr={m.result.incident.summary_fr}
                      summaryAr={m.result.incident.summary_ar}
                      matchedCampaign={
                        m.result.incident.matched_campaign || undefined
                      }
                      graceFlag={m.result.incident.grace_period_flag}
                      toolsUsed={m.result.decision_tree_path?.length || 4}
                    />
                  </MessageBubble>
                );
              case "smart-prompt":
                return (
                  <MessageBubble key={m.id} variant="ars-rich" withAvatar={false}>
                    <SmartPromptButtons
                      question={m.question}
                      onAnswer={(a) => handleSmartPromptAnswer(m.id, a)}
                    />
                  </MessageBubble>
                );
              case "typing":
                return (
                  <MessageBubble key={m.id} variant="ars-text">
                    <span className="inline-flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse-dot" />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse-dot"
                        style={{ animationDelay: "200ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse-dot"
                        style={{ animationDelay: "400ms" }}
                      />
                    </span>
                  </MessageBubble>
                );
            }
          })}
        </div>
      </div>

      <footer className="sticky bottom-0 bg-bg/95 backdrop-blur-sm border-t border-border-soft py-3">
        <div className="max-w-[480px] mx-auto px-4 flex items-end gap-3">
          <input
            type="text"
            value={composing}
            onChange={(e) => setComposing(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendText();
            }}
            placeholder="Écris ce qui s'est passé…"
            className="flex-1 h-11 px-4 bg-surface border border-border rounded-[22px] text-[14px] focus:border-sentinel focus:outline-none placeholder:text-text-dim"
            disabled={busy}
            aria-label="Décrire l'incident"
          />
          {composing ? (
            <button
              type="button"
              onClick={handleSendText}
              disabled={busy}
              aria-label="Envoyer"
              className="w-11 h-11 rounded-full bg-sentinel text-bg flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" strokeWidth={2.5} />
            </button>
          ) : (
            <MicButton onComplete={handleAudio} size={44} disabled={busy} />
          )}
        </div>
        <div className="max-w-[480px] mx-auto px-4 mt-2 text-center text-[10px] font-mono text-text-dim uppercase tracking-wider">
          {busy
            ? "ARS appelle 4 outils…"
            : "Maintiens le micro pour parler · Darija accepté"}
        </div>
      </footer>
    </div>
  );
}
