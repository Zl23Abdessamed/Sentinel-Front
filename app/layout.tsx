import type { Metadata } from "next";
import { Inter, JetBrains_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

// Three font families wired through CSS variables so Tailwind's font-sans /
// font-mono / font-ar utilities resolve to next/font-optimised stacks.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-arabic",
});

export const metadata: Metadata = {
  title: "SENTINEL.DZ — Réponse cyber souveraine",
  description:
    "Système algérien de signalement et réponse aux incidents cyber. Voix Darija → classification IA → réponse coordonnée — Loi 18-07, Décret 26-07.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${jetbrains.variable} ${plexArabic.variable} dark`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
