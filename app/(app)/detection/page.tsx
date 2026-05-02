"use client";

import Link from "next/link";
import { Topbar } from "@/components/nav/Topbar";
import { Card } from "@/components/ui/card";
import { Mail, FileText, Wifi, ArrowRight, Satellite, ShieldAlert } from "lucide-react";

export default function DetectionPage() {
  const modes = [
    {
      id: "gateway",
      title: "Gateway & Communications",
      description: "Analyse en direct des emails et flux WhatsApp. Intercepte le phishing et l'ingénierie sociale.",
      icon: Mail,
      href: "/detection/gateway",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      id: "audit",
      title: "Audit & Surveillance Fichiers",
      description: "Surveillance comportementale et leurres (Honeypot). Identifie les menaces internes.",
      icon: FileText,
      href: "/detection/audit",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
    },
    {
      id: "network",
      title: "Radar & Scan Réseau",
      description: "Balayage militaire du réseau (Nmap virtuel). Détecte les intrusions et appareils fantômes.",
      icon: Wifi,
      href: "/detection/network",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0a0f18] text-white">
      <Topbar title="Centre de Détection" subtitle="Intelligence Active · 3 Vecteurs" />

      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-3 flex items-center gap-3">
              <Satellite className="w-8 h-8 text-sentinel" />
              Sélection du Vecteur de Détection
            </h1>
            <p className="text-gray-400 max-w-2xl text-lg">
              Choisissez un module de détection pour visualiser l'activité des menaces en temps réel.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 border border-red-500/20 rounded-full text-sm font-mono animate-pulse">
            <ShieldAlert className="w-4 h-4" /> Actif
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-4">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Link key={mode.id} href={mode.href}>
                <Card className={`p-6 bg-[#0f172a] border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${mode.borderColor} cursor-pointer group h-full flex flex-col`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${mode.bg} ${mode.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{mode.title}</h3>
                  <p className="text-gray-400 text-sm flex-1 leading-relaxed">
                    {mode.description}
                  </p>
                  <div className={`mt-6 flex items-center justify-between text-sm font-bold ${mode.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                    Démarrer
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}