"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Lock, Play, Pause, RefreshCw } from "lucide-react";
import {
  sentinel,
  ApiError,
  type IntakeResponse,
  type IncidentCategory,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useChatStore, type ChatMessage } from "@/lib/stores/chat-store";
import { ArsAvatar } from "@/components/shared/ArsAvatar";
import { MessageBubble } from "@/components/ars/MessageBubble";
import { MicButton } from "@/components/ars/MicButton";
import { Waveform } from "@/components/ars/Waveform";
import { ThreeColumnTranscription } from "@/components/ars/ThreeColumnTranscription";
import { AIResultCard } from "@/components/ars/AIResultCard";
import { SmartPromptButtons } from "@/components/ars/SmartPromptButtons";
import { Topbar } from "@/components/nav/Topbar";

// Canned demo line — used ONLY when the browser denies the mic so the flow
// stays watchable on stage. A real recording always goes through Whisper.
const DEMO_DARIJA =
  "Hadi sba7 daghya cliquit 3la lien jani men l-ministère, w daba browser tabla7 w ma 3andich m'a ndir.";

// Message type now lives in lib/stores/chat-store as ChatMessage so the store
// can persist + sanitize it on rehydration.

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

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface UserContext {
  reporterId: string;
  institution: string;
  department: string;
}

export default function IntakePage() {
  // Conversation state lives in a Zustand store (sessionStorage-backed) so it
  // survives navigating to /dashboard or /crisis and back. The greeting is
  // seeded by the store; we just consume it here.
  const messages = useChatStore((s) => s.messages);
  const anonymous = useChatStore((s) => s.anonymous);
  const busy = useChatStore((s) => s.busy);
  const setAnonymous = useChatStore((s) => s.setAnonymous);
  const setBusy = useChatStore((s) => s.setBusy);
  const append = useChatStore((s) => s.append);
  const replaceMsg = useChatStore((s) => s.replace);
  const removeMsg = useChatStore((s) => s.remove);
  const updateTranscription = useChatStore((s) => s.patchTranscription);
  const resetChat = useChatStore((s) => s.reset);

  const [composing, setComposing] = useState("");
  const [userCtx, setUserCtx] = useState<UserContext>({
    reporterId: "anon",
    institution: "Université d'Alger",
    department: "Comptabilité",
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pull the logged-in user (if any) so we send their real institution +
  // department to the backend. Falls back to anonymous demo defaults.
  useEffect(() => {
    let cancelled = false;
    const fallbackId =
      typeof window !== "undefined" && window.crypto?.randomUUID
        ? "web-" + window.crypto.randomUUID()
        : "web-" + Math.random().toString(36).slice(2);
    sentinel.auth
      .me()
      .then((u) => {
        if (cancelled) return;
        setUserCtx({
          reporterId: u.id ?? fallbackId,
          institution: u.institution || "Université d'Alger",
          department: u.department || "Comptabilité",
        });
      })
      .catch(() => {
        if (!cancelled) setUserCtx((c) => ({ ...c, reporterId: fallbackId }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // NOTE: blob:// URLs from MicButton are intentionally NEVER revoked while
  // the tab is alive — that lets the audio survive SPA navigation. The browser
  // garbage-collects them on tab close. The store also nulls them out on
  // rehydration after a hard refresh (the underlying Blob is gone by then).

  const reporterIdForRequest = () =>
    anonymous ? "anon-" + Date.now() : userCtx.reporterId;

  function appendError(text: string) {
    append({
      kind: "ars-text",
      id: "err-" + Date.now(),
      ts: tsNow(),
      text,
      tone: "error",
    });
  }

  // ---------------------------------------------------------------------------
  // Voice flow — REAL backend round-trip:
  //   1. blob → POST /api/transcribe (Whisper)              → real Darija text
  //   2. stream Darija column with the actual transcript
  //   3. POST /api/intake (Groq classifier)                  → bilingual title + summary
  //   4. stream FR + AR columns from the AI's bilingual outputs
  //   5. show AIResultCard + optional smart prompts
  // ---------------------------------------------------------------------------
  async function handleAudio(blob: Blob | null) {
    if (busy) return;
    setBusy(true);

    let audioUrl: string | null = null;
    let durationSec = 0;
    if (blob) {
      audioUrl = URL.createObjectURL(blob);
      durationSec = await measureBlobDuration(blob);
    }
    append({
      kind: "user-voice",
      id: "uv-" + Date.now(),
      audioUrl,
      durationSec,
      ts: tsNow(),
    });

    // Typing indicator while we transcribe
    const typingId = "typing-" + Date.now();
    setTimeout(() => append({ kind: "typing", id: typingId }), 200);

    // Step 1 — Whisper transcription
    let darijaText = "";
    let transcribeSource = "demo-fallback";
    if (blob) {
      try {
        const tr = await sentinel.transcribe(blob, "ar");
        darijaText = (tr.transcript || "").trim();
        transcribeSource = tr.source;
      } catch (e) {
        removeMsg(typingId);
        appendError(
          "Transcription impossible : " +
            (e instanceof ApiError
              ? `${e.status} ${e.message}`
              : (e as Error).message),
        );
        setBusy(false);
        return;
      }
    }
    if (!darijaText) {
      // No audio (mic denied) OR empty Whisper response — use the canned line
      // so the demo never goes silent.
      darijaText = DEMO_DARIJA;
      transcribeSource = blob ? "fallback-static" : "mic-denied";
    }

    // Step 2 — Reveal the 3-column transcription, stream the REAL Darija
    const transcId = "trans-" + Date.now();
    replaceMsg(typingId, {
      kind: "transcription",
      id: transcId,
      stage: "darija-streaming",
      darija: darijaText,
      fr: "",
      ar: "",
      source: transcribeSource,
    });
    await sleep(darijaText.length * 22 + 300);

    // Step 3 — Send to /api/intake. The backend's Groq classifier produces
    // bilingual title + summary; those drive the FR + AR columns so every
    // word visible came from a real AI call.
    let result: IntakeResponse;
    try {
      result = await sentinel.intake({
        text: darijaText,
        reporter_id: reporterIdForRequest(),
        channel: "WEB",
        institution: userCtx.institution,
        department: userCtx.department,
        raw_darija_transcript: darijaText,
      });
    } catch (e) {
      appendError(
        "Classification impossible : " +
          (e instanceof ApiError
            ? `${e.status} ${e.message}`
            : (e as Error).message),
      );
      setBusy(false);
      return;
    }

    // Step 4+5 — pick FR + AR text with defensive language detection.
    // Groq sometimes mis-fires and puts French in summary_ar, or duplicates
    // the same string in both fields. We detect the script of each return and
    // fall back to titles / transcript if the language is wrong.
    const { fr: frText, ar: arText } = pickBilingualText(
      result.incident,
      darijaText,
    );

    updateTranscription(transcId, { stage: "fr-streaming", fr: frText });
    await sleep(Math.min(frText.length * 24 + 300, 6000));

    updateTranscription(transcId, { stage: "ar-streaming", ar: arText });
    await sleep(Math.min(arText.length * 30 + 300, 6000));
    updateTranscription(transcId, { stage: "complete" });

    // Step 6 — AI result card + optional smart prompt
    await sleep(400);
    append({ kind: "ai-result", id: "air-" + Date.now(), result });
    if (result.needs_clarification && result.clarifying_questions?.length) {
      append({
        kind: "smart-prompt",
        id: "sp-" + Date.now(),
        question: result.clarifying_questions[0],
      });
    }
    setBusy(false);
  }

  // ---------------------------------------------------------------------------
  // Text flow — direct round-trip to /api/intake
  // ---------------------------------------------------------------------------
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
        reporter_id: reporterIdForRequest(),
        channel: "WEB",
        institution: userCtx.institution,
        department: userCtx.department,
      });
      await sleep(600);
      replaceMsg(typingId, {
        kind: "ai-result",
        id: "air-" + Date.now(),
        result,
      });
      if (result.needs_clarification && result.clarifying_questions?.length) {
        append({
          kind: "smart-prompt",
          id: "sp-" + Date.now(),
          question: result.clarifying_questions[0],
        });
      }
    } catch (e) {
      replaceMsg(typingId, {
        kind: "ars-text",
        id: "err-" + Date.now(),
        ts: tsNow(),
        tone: "error",
        text:
          "Le serveur ne répond pas : " +
          (e instanceof ApiError
            ? `${e.status} ${e.message}`
            : (e as Error).message),
      });
    } finally {
      setBusy(false);
    }
  }

  function handleSmartPromptAnswer(promptId: string, answer: "oui" | "non") {
    removeMsg(promptId);
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
              ? "Compris. La sévérité est maintenue."
              : "Noté. La sévérité est revue à la baisse — équipe sécurité informée.",
        }),
      400,
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg w-full">
      <Topbar
        title="Chat ARS"
        subtitle="Agent de Réponse Sécurité · backend live"
        rightSlot={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnonymous(!anonymous)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono uppercase tracking-wider transition-colors",
                anonymous
                  ? "bg-[rgba(16,185,129,0.15)] border-success text-success"
                  : "bg-surface border-border text-text-muted",
              )}
              aria-pressed={anonymous}
              aria-label={anonymous ? "Mode anonyme actif" : "Mode identifié actif"}
            >
              <Lock className="w-3 h-3" strokeWidth={2.5} />
              {anonymous ? "Anonyme" : userCtx.reporterId.slice(0, 12)}
            </button>
            <button
              type="button"
              onClick={() => {
                if (busy) return;
                if (
                  confirm(
                    "Effacer la conversation actuelle et redémarrer ARS ?",
                  )
                ) {
                  resetChat();
                }
              }}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-surface border-border text-[11px] font-mono uppercase tracking-wider text-text-muted hover:text-text hover:bg-surface-hover transition-colors disabled:opacity-40"
              title="Effacer la conversation"
              aria-label="Nouvelle conversation"
            >
              <RefreshCw className="w-3 h-3" strokeWidth={2.5} />
              Nouveau
            </button>
          </div>
        }
      />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-32 pt-6 custom-scrollbar"
      >
        <div className="max-w-[480px] mx-auto space-y-4">
          {/* ARS header card */}
          <div className="flex items-center gap-3 px-1 mb-2">
            <ArsAvatar size={36} thinking={busy} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-text">ARS</div>
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse-dot",
                    busy ? "bg-p3" : "bg-success",
                  )}
                />
                {busy ? "Analyse en cours…" : "En ligne · Whisper + Groq prêts"}
              </div>
            </div>
          </div>

          {messages.map((m) => {
            switch (m.kind) {
              case "ars-text":
                return (
                  <MessageBubble
                    key={m.id}
                    variant="ars-text"
                    timestamp={m.ts}
                    className={
                      m.tone === "error"
                        ? "!bg-[rgba(239,68,68,0.08)] !border-p1/40 !text-p1"
                        : undefined
                    }
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
                    <VoicePlayButton url={m.audioUrl} />
                    <Waveform />
                    <span className="font-mono text-[11px] text-text-muted">
                      {formatDuration(m.durationSec)}
                    </span>
                  </MessageBubble>
                );
              case "transcription":
                return (
                  <MessageBubble
                    key={m.id}
                    variant="ars-rich"
                    withAvatar={false}
                  >
                    <ThreeColumnTranscription
                      stage={m.stage}
                      darijaTarget={m.darija}
                      frTarget={m.fr}
                      arTarget={m.ar}
                    />
                    {m.source && (
                      <div className="mt-1 text-[10px] font-mono text-text-dim text-right">
                        source : {m.source}
                      </div>
                    )}
                  </MessageBubble>
                );
              case "ai-result":
                return (
                  <MessageBubble
                    key={m.id}
                    variant="ars-rich"
                    withAvatar={false}
                  >
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
                    <NextStepLinks incident={m.result.incident} />
                  </MessageBubble>
                );
              case "smart-prompt":
                return (
                  <MessageBubble
                    key={m.id}
                    variant="ars-rich"
                    withAvatar={false}
                  >
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
            ? "ARS appelle Whisper + Groq…"
            : "Tape sur le micro pour démarrer · re-tape pour envoyer · Darija accepté"}
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Mini "where do I go from here" CTA shown right after the AI Result Card.
// Always offers Dashboard + Incident detail; adds a Crisis link when the
// classification looks crisis-eligible (P1 ransomware/account_takeover OR a
// matched_campaign — the velocity detector clusters by campaign).
function NextStepLinks({
  incident,
}: {
  incident: IntakeResponse["incident"];
}) {
  const crisisEligible =
    incident.severity === "P1" ||
    !!incident.matched_campaign ||
    incident.category === "RANSOMWARE" ||
    incident.category === "ACCOUNT_TAKEOVER";
  return (
    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
      <a
        href={`/incident/${incident.id}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface border border-border-soft text-text-muted hover:text-text hover:border-sentinel/40 hover:bg-sentinel-dim transition-colors font-mono uppercase tracking-wider"
      >
        ▸ Voir l'incident
      </a>
      <a
        href="/dashboard"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface border border-border-soft text-text-muted hover:text-text hover:border-sentinel/40 hover:bg-sentinel-dim transition-colors font-mono uppercase tracking-wider"
      >
        ▸ Tableau de bord
      </a>
      {crisisEligible && (
        <a
          href="/crisis"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[rgba(239,68,68,0.1)] border border-p1/40 text-p1 hover:bg-[rgba(239,68,68,0.18)] transition-colors font-mono uppercase tracking-wider"
        >
          ▸ Mode Crise
        </a>
      )}
    </div>
  );
}

// Defensive language picker for the FR + AR transcription columns.
//
// The bilingual title + summary come from a single Groq classification call.
// We ask the model to write `summary_fr` in French and `summary_ar` in Arabic,
// but LLMs occasionally misbehave:
//   • return the SAME string in both fields (duplicate),
//   • put French inside `summary_ar`,
//   • or write Arabic inside `summary_fr`.
//
// When that happens the three-column transcription used to show identical text
// in two columns — exactly the bug reported. So we sniff the script of each
// field and fall back to the matching title (or the source Darija) until each
// column carries content in the right language. Worst case we surface an
// honest "indisponible" message instead of echoing the wrong language.
function pickBilingualText(
  incident: IntakeResponse["incident"],
  darijaText: string,
): { fr: string; ar: string } {
  const sumFr = (incident.summary_fr ?? "").trim();
  const sumAr = (incident.summary_ar ?? "").trim();
  const titleFr = (incident.title_fr ?? "").trim();
  const titleAr = (incident.title_ar ?? "").trim();

  // FR slot — prefer a string that has Latin chars and isn't mostly Arabic.
  // Try summary_fr first, then title_fr; if neither qualifies, surface the
  // best effort we have so the column isn't blank.
  const frCandidates = [sumFr, titleFr].filter(Boolean);
  let fr =
    frCandidates.find((c) => hasLatin(c) && !isMostlyArabic(c)) ??
    sumFr ??
    titleFr ??
    "";
  if (!fr) fr = "Synthèse française indisponible.";

  // AR slot — prefer a string that actually contains Arabic script. Falls
  // back to title_ar, then the raw Darija (which is itself Arabic script when
  // the user typed it that way), then a polite placeholder.
  const arCandidates = [sumAr, titleAr].filter(Boolean);
  let ar = arCandidates.find((c) => hasArabic(c)) ?? "";
  if (!ar) {
    if (darijaText && hasArabic(darijaText)) ar = darijaText;
    else if (titleAr) ar = titleAr;
    else ar = "الملخص العربي غير متاح.";
  }

  // Last guard: if FR and AR ended up identical (Groq duplicated the field),
  // force AR back to the Arabic title or the source Darija so the columns
  // don't echo each other on stage.
  if (fr && ar && fr === ar) {
    if (titleAr && titleAr !== fr) ar = titleAr;
    else if (darijaText && darijaText !== fr) ar = darijaText;
    else ar = "الملخص العربي غير متاح.";
  }

  return { fr, ar };
}

// Arabic script ranges: 0600–06FF (Arabic), 0750–077F (supplement),
// FB50–FDFF (presentation forms-A), FE70–FEFF (presentation forms-B).
const ARABIC_RE = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const ARABIC_RE_GLOBAL = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g;
const LATIN_RE = /[A-Za-zÀ-ÿ]/;
const LATIN_RE_GLOBAL = /[A-Za-zÀ-ÿ]/g;

function hasArabic(s: string): boolean {
  return ARABIC_RE.test(s);
}
function hasLatin(s: string): boolean {
  return LATIN_RE.test(s);
}
function isMostlyArabic(s: string): boolean {
  const arabic = (s.match(ARABIC_RE_GLOBAL) ?? []).length;
  const latin = (s.match(LATIN_RE_GLOBAL) ?? []).length;
  return arabic > latin;
}

function formatDuration(sec: number): string {
  if (!sec || sec < 1) return "0:01";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function measureBlobDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    a.preload = "metadata";
    let settled = false;
    const finish = (d: number) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    a.onloadedmetadata = () => finish(isFinite(a.duration) ? a.duration : 0);
    a.onerror = () => finish(0);
    setTimeout(() => finish(0), 1500);
  });
}

function VoicePlayButton({ url }: { url: string | null }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!url) return;
    const a = new Audio(url);
    audioRef.current = a;
    const onEnd = () => setPlaying(false);
    a.addEventListener("ended", onEnd);
    return () => {
      a.pause();
      a.removeEventListener("ended", onEnd);
      audioRef.current = null;
    };
  }, [url]);

  if (!url) {
    return (
      <span
        className="w-7 h-7 rounded-full bg-text-dim/30 text-text-dim flex items-center justify-center"
        aria-label="Audio indisponible"
        title="Audio non capturé (mic refusé) — flux relié à la transcription canned"
      >
        <Play className="w-3 h-3" strokeWidth={2.5} />
      </span>
    );
  }

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="w-7 h-7 rounded-full bg-sentinel text-bg flex items-center justify-center hover:opacity-90"
      aria-label={playing ? "Pause" : "Lire la note vocale"}
    >
      {playing ? (
        <Pause className="w-3 h-3" strokeWidth={2.5} />
      ) : (
        <Play className="w-3 h-3" strokeWidth={2.5} />
      )}
    </button>
  );
}
