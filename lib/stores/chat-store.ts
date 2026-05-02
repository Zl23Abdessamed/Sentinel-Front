"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { IntakeResponse } from "@/lib/api";
import type { TranscriptionStage } from "@/components/ars/ThreeColumnTranscription";

// Chat-with-ARS conversation state. Lives in a Zustand store so it survives
// SPA navigation (e.g. user goes to /dashboard then back to /intake — the
// previous transcripts, voice bubbles, and AI Result Cards are still there).
//
// Persistence: sessionStorage. The conversation outlives navigation but a
// hard refresh / closing the tab clears it (good privacy default — the audio
// blobs are gone anyway, since blob:// URLs only live in tab memory).
//
// On rehydration we sanitize:
//   - drop transient "typing" placeholders (someone might have left mid-call)
//   - mark any in-flight "transcription" as complete (text fields are already
//     populated, just no more streaming animation needed)
//   - null out audioUrl on user-voice bubbles (the underlying blob is dead
//     after a refresh; the bubble will show an "audio indisponible" pill)

export type ChatMessage =
  | {
      kind: "ars-text";
      id: string;
      text: string;
      ts: string;
      tone?: "default" | "error";
    }
  | { kind: "user-text"; id: string; text: string; ts: string }
  | {
      kind: "user-voice";
      id: string;
      audioUrl: string | null;
      durationSec: number;
      ts: string;
    }
  | {
      kind: "transcription";
      id: string;
      stage: TranscriptionStage;
      darija: string;
      fr: string;
      ar: string;
      source?: string;
    }
  | { kind: "ai-result"; id: string; result: IntakeResponse }
  | { kind: "smart-prompt"; id: string; question: string }
  | { kind: "typing"; id: string };

const INITIAL_GREETING: ChatMessage = {
  kind: "ars-text",
  id: "init-1",
  ts: tsNow(),
  text:
    "Salam. Je suis ARS, ton agent de réponse sécurité. Décris-moi ce qui se passe — par voix ou par texte. Tu peux rester anonyme.",
};

interface ChatState {
  messages: ChatMessage[];
  anonymous: boolean;
  busy: boolean;

  setAnonymous: (a: boolean) => void;
  setBusy: (b: boolean) => void;

  append: (msg: ChatMessage) => void;
  replace: (id: string, msg: ChatMessage) => void;
  remove: (id: string) => void;
  patchTranscription: (
    id: string,
    patch: Partial<Extract<ChatMessage, { kind: "transcription" }>>,
  ) => void;

  reset: () => void;
}

function tsNow() {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [INITIAL_GREETING],
      anonymous: true,
      busy: false,

      setAnonymous: (a) => set({ anonymous: a }),
      setBusy: (b) => set({ busy: b }),

      append: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

      replace: (id, msg) =>
        set((s) => ({
          messages: s.messages.map((x) => (x.id === id ? msg : x)),
        })),

      remove: (id) =>
        set((s) => ({ messages: s.messages.filter((x) => x.id !== id) })),

      patchTranscription: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((x) =>
            x.id === id && x.kind === "transcription" ? { ...x, ...patch } : x,
          ),
        })),

      reset: () =>
        set({
          messages: [{ ...INITIAL_GREETING, ts: tsNow() }],
          busy: false,
        }),
    }),
    {
      name: "ars-chat",
      storage: createJSONStorage(() => sessionStorage),
      // Reset transient runtime fields on every rehydration so a refresh or
      // late return after an SSE timeout doesn't strand a "typing…" or
      // half-streamed transcription.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.busy = false;
        state.messages = state.messages
          .filter((m) => m.kind !== "typing")
          .map((m) => {
            if (m.kind === "transcription") {
              return { ...m, stage: "complete" as TranscriptionStage };
            }
            if (m.kind === "user-voice") {
              // The blob:// URL may be dead (refresh discards it). Keep the
              // bubble but mark audio as unavailable.
              const looksAlive =
                typeof m.audioUrl === "string" &&
                m.audioUrl.startsWith("blob:") &&
                isSameTabUrl(m.audioUrl);
              return looksAlive ? m : { ...m, audioUrl: null };
            }
            return m;
          });
      },
    },
  ),
);

// Heuristic — same-tab blob URLs share the document.location origin. After
// a hard refresh the URL string is still in sessionStorage but the blob is
// gone; we can't actually probe without trying to load it, so we accept all
// well-formed blob URLs and let the audio element error gracefully if dead.
function isSameTabUrl(url: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const u = new URL(url);
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
}
