"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

// Hold-to-record. Default green; recording state is solid red with a pulsing
// halo. The component falls back gracefully when the browser denies mic
// permission — onComplete fires with `null` so the page can still pivot to a
// canned demo voice clip without a hard failure on stage.

interface MicButtonProps {
  onComplete: (audio: Blob | null) => void;
  size?: number;
  disabled?: boolean;
  className?: string;
}

export function MicButton({
  onComplete,
  size = 80,
  disabled,
  className,
}: MicButtonProps) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedRef = useRef<number>(0);

  const startRecord = async () => {
    if (recording || disabled) return;
    setRecording(true);
    startedRef.current = Date.now();
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        throw new Error("MediaDevices unavailable");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const elapsed = Date.now() - startedRef.current;
        if (elapsed < 250 || chunksRef.current.length === 0) {
          onComplete(null);
        } else {
          onComplete(new Blob(chunksRef.current, { type: "audio/webm" }));
        }
      };
      mr.start();
      recorderRef.current = mr;
    } catch {
      // Mic denied / no MediaDevices — short-press to canned demo path.
      // Keep the recording UI on briefly so the user feels the press.
      setTimeout(() => {
        setRecording(false);
        onComplete(null);
      }, 600);
    }
  };

  const stopRecord = () => {
    if (!recording) return;
    setRecording(false);
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
    };
  }, []);

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={startRecord}
      onMouseUp={stopRecord}
      onMouseLeave={stopRecord}
      onTouchStart={(e) => {
        e.preventDefault();
        startRecord();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        stopRecord();
      }}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        recording
          ? "bg-p1 text-white scale-105 animate-alarm-pulse"
          : "bg-success text-white hover:scale-105",
        disabled && "opacity-40 cursor-not-allowed",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={
        recording
          ? "Enregistrement en cours, relâcher pour envoyer"
          : "Maintenir pour enregistrer un message vocal"
      }
      aria-pressed={recording}
    >
      <Mic className="w-7 h-7" strokeWidth={2.2} />
    </button>
  );
}
