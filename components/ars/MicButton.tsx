"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

// Tap-to-toggle voice capture.
//   1st tap → starts recording (asks for mic permission the first time)
//   2nd tap → stops, builds the audio Blob, fires onComplete(blob)
//
// A live elapsed-time chip + animated halo make it obvious recording is on.
// A 60-second safety cap auto-stops if the user forgets to tap again.
//
// onComplete fires with `null` only when the user tapped to start, the browser
// denied the mic OR returned no audio bytes (very short tap, no signal). The
// page treats `null` as "no audio captured" and can pivot to a canned demo.

interface MicButtonProps {
  onComplete: (audio: Blob | null) => void;
  size?: number;
  disabled?: boolean;
  className?: string;
  /** Hard ceiling in seconds (default 60). */
  maxSeconds?: number;
}

export function MicButton({
  onComplete,
  size = 80,
  disabled,
  className,
  maxSeconds = 60,
}: MicButtonProps) {
  const [recording, setRecording] = useState(false);
  const [busyStarting, setBusyStarting] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupTimers = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
  };

  const tearDown = () => {
    cleanupTimers();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
  };

  const startRecording = async () => {
    if (recording || busyStarting || disabled) return;
    setBusyStarting(true);
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        throw new Error("MediaDevices API unavailable");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = pickMime();
      const mr = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        cleanupTimers();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        setElapsedSec(0);
        const blob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" })
            : null;
        chunksRef.current = [];
        onComplete(blob);
      };

      // request data every 500ms so chunksRef accumulates progressively
      mr.start(500);
      recorderRef.current = mr;
      startedRef.current = Date.now();
      setRecording(true);
      setElapsedSec(0);
      tickRef.current = setInterval(() => {
        setElapsedSec(
          Math.floor((Date.now() - startedRef.current) / 1000),
        );
      }, 250);
      safetyRef.current = setTimeout(() => stopRecording(), maxSeconds * 1000);
    } catch (e) {
      // Mic denied / unavailable — surface as "no audio captured" so the page
      // can offer a friendly fallback. We DO NOT silently fake a recording.
      tearDown();
      setRecording(false);
      setElapsedSec(0);
      console.warn("mic permission failed:", e);
      onComplete(null);
    } finally {
      setBusyStarting(false);
    }
  };

  const stopRecording = () => {
    const mr = recorderRef.current;
    if (!mr) {
      // Race: stop tapped before recorder was wired. Just clean up.
      tearDown();
      setRecording(false);
      setElapsedSec(0);
      return;
    }
    if (mr.state === "recording") {
      try {
        mr.requestData();
      } catch {
        /* ignore — some browsers throw on early requestData */
      }
      mr.stop();
    }
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (recording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === "recording") {
        try {
          recorderRef.current.stop();
        } catch {
          /* noop */
        }
      }
      tearDown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = recording
    ? `Arrêter et envoyer · ${formatSec(elapsedSec)}`
    : busyStarting
      ? "Initialisation du micro…"
      : "Cliquer pour enregistrer";

  return (
    <div
      className={cn("relative inline-flex items-center gap-2", className)}
    >
      {recording && (
        <div
          className="font-mono text-[11px] tabular-nums px-2 py-1 rounded-md bg-p1/10 border border-p1/30 text-p1 inline-flex items-center gap-1.5"
          aria-live="polite"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-p1 animate-pulse-dot" />
          REC {formatSec(elapsedSec)}
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        onTouchStart={handleClick}
        disabled={disabled || busyStarting}
        aria-label={label}
        aria-pressed={recording}
        title={label}
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          recording
            ? "bg-p1 text-white scale-105 animate-alarm-pulse"
            : "bg-success text-white hover:scale-105 hover:shadow-glow",
          (disabled || busyStarting) && "opacity-50 cursor-not-allowed",
        )}
        style={{ width: size, height: size }}
      >
        {recording ? (
          <Square className="w-6 h-6 fill-white" strokeWidth={2.2} />
        ) : (
          <Mic className="w-7 h-7" strokeWidth={2.2} />
        )}
      </button>
    </div>
  );
}

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Pick a mimeType the browser supports. Some Chromium setups don't accept the
// explicit `audio/webm;codecs=opus` and need just `audio/webm`. Safari prefers
// `audio/mp4`. Fall back to "" to let the browser choose.
function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}
