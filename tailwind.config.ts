import type { Config } from "tailwindcss";

// Tokens taken from index.html (deeper bg) + SENTINEL_DZ_DESIGN_SYSTEM.md.
// Wherever the screens disagree with the design-system doc, the screens win
// per spec rule #5 ("if the designer shipped it, you build it").
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-hover": "var(--surface-hover)",
        border: "var(--border)",
        "border-soft": "var(--border-soft)",
        "border-focus": "var(--border-focus)",
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          dim: "var(--text-dim)",
          mono: "var(--text-mono)",
        },
        sentinel: {
          DEFAULT: "var(--sentinel)",
          dim: "var(--sentinel-dim)",
        },
        vault: {
          DEFAULT: "var(--vault)",
          dim: "var(--vault-dim)",
        },
        classifier: "var(--classifier)",
        auditor: "var(--auditor)",
        p1: "var(--p1-critical)",
        p2: "var(--p2-high)",
        p3: "var(--p3-medium)",
        p4: "var(--p4-low)",
        success: "var(--success)",
        whisper: "var(--whisper)",
        neutral: "var(--neutral)",
        crisis: {
          bg: "var(--crisis-bg)",
          pulse: "var(--crisis-pulse)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
        ar: ["var(--font-plex-arabic)", "IBM Plex Sans Arabic", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
        md: "0 4px 12px rgba(0, 0, 0, 0.5)",
        lg: "0 12px 32px rgba(0, 0, 0, 0.6)",
        glow: "0 0 24px rgba(245, 158, 11, 0.35)",
        crisis: "0 0 32px rgba(239, 68, 68, 0.5)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      animation: {
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        "stream-blink": "stream-blink 1s steps(2) infinite",
        "bubble-in": "bubble-in 320ms cubic-bezier(0.16, 1, 0.3, 1)",
        "feed-in": "feed-in 320ms cubic-bezier(0.16, 1, 0.3, 1)",
        "crisis-glow": "crisis-glow 2s ease-in-out infinite",
        "alarm-pulse": "alarm-pulse 1.4s ease-out infinite",
        "crisis-breathe": "crisis-breathe 4s ease-in-out infinite",
        "drop-bounce": "drop-bounce 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "sla-pulse": "sla-pulse 1.4s ease-in-out infinite",
        "row-flash": "row-flash 600ms ease-out",
        shimmer: "shimmer 1.4s linear infinite",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(0.92)" },
        },
        "stream-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "bubble-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "feed-in": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "crisis-glow": {
          "0%, 100%": { boxShadow: "0 0 24px rgba(239, 68, 68, 0.35)" },
          "50%": { boxShadow: "0 0 36px rgba(239, 68, 68, 0.65)" },
        },
        "alarm-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.6)" },
          "100%": { boxShadow: "0 0 0 18px rgba(239, 68, 68, 0)" },
        },
        "crisis-breathe": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "drop-bounce": {
          "0%": { opacity: "0", transform: "translateY(-100%)" },
          "60%": { transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "sla-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "row-flash": {
          "0%": { background: "rgba(239, 68, 68, 0.3)", transform: "translateX(-8px)" },
          "100%": { background: "rgba(239, 68, 68, 0.08)", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
