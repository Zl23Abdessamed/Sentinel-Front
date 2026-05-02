import { cn } from "@/lib/utils";

// ARS avatar = circular gradient (amber → cyan), white shield-mic glyph,
// status dot bottom-right. Rotates slowly when "thinking" (the gradient
// container spins; the glyph is on a separate z-layer so it stays still).

interface ArsAvatarProps {
  size?: number;
  thinking?: boolean;
  online?: boolean;
  className?: string;
}

export function ArsAvatar({
  size = 40,
  thinking = false,
  online = true,
  className,
}: ArsAvatarProps) {
  const dotSize = Math.max(8, size * 0.22);
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full ring-1 ring-border-soft shrink-0",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="ARS — Agent de Réponse Sécurité"
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full",
          thinking && "animate-[spin_4s_linear_infinite]",
        )}
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #06b6d4 100%)",
        }}
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative z-10"
        style={{ width: size * 0.5, height: size * 0.5, opacity: 0.85 }}
        aria-hidden
      >
        <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
        <rect x="10" y="8" width="4" height="6" rx="2" fill="white" stroke="none" opacity="0.85" />
        <path d="M8 13a4 4 0 008 0M12 17v2" />
      </svg>
      <span
        className={cn(
          "absolute bottom-0 right-0 rounded-full ring-2 ring-bg",
          thinking ? "bg-p3 animate-pulse-dot" : online ? "bg-success" : "bg-text-dim",
        )}
        style={{ width: dotSize, height: dotSize }}
        aria-label={thinking ? "ARS réfléchit" : online ? "ARS en ligne" : "ARS hors ligne"}
      />
    </div>
  );
}
