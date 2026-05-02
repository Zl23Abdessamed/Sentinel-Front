"use client";

// Static waveform — used inside user-voice bubbles to show recorded audio.
// Heights pre-baked to look like a real speech waveform without runtime cost.
const STATIC_HEIGHTS = [4, 9, 14, 7, 11, 18, 13, 6, 16, 10, 8, 14, 6, 12, 9];

export function Waveform({
  heights = STATIC_HEIGHTS,
  color = "var(--text-muted)",
}: {
  heights?: number[];
  color?: string;
}) {
  return (
    <div className="inline-flex items-center gap-[2px] h-5">
      {heights.map((h, i) => (
        <span
          key={i}
          className="inline-block w-[2px] rounded-sm"
          style={{ height: `${h}px`, background: color }}
        />
      ))}
    </div>
  );
}

// Animated bars used inside the recording state of MicButton.
export function RecWave({ color = "white" }: { color?: string }) {
  return (
    <div className="inline-flex items-center gap-[2px] h-5">
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-[2px] rounded-sm"
          style={{
            background: color,
            height: `${4 + Math.abs(Math.sin(i * 0.7)) * 14}px`,
            animation: `rec-bar 0.9s ease-in-out ${i * 0.04}s infinite alternate`,
          }}
        />
      ))}
      <style>{`@keyframes rec-bar { from { transform: scaleY(0.4); } to { transform: scaleY(1.4); } }`}</style>
    </div>
  );
}
