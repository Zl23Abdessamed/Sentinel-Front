"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  ShieldAlert,
  MessageCircle,
  Sparkles,
  FileSearch,
  Settings,
  Bell,
  Radar,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Travail",
    items: [
      { href: "/intake", label: "Chat ARS", icon: MessageCircle },
      { href: "/dashboard", label: "Dashboard", icon: Shield },
      { href: "/crisis", label: "Mode Crise", icon: ShieldAlert },
      { href: "/detection", label: "Détection", icon: Radar },
      { href: "/ai-classify", label: "Théâtre IA", icon: Sparkles },
    ],
  },
  {
    section: "Conformité",
    items: [
      { href: "/black-box", label: "Boîte Noire", icon: FileSearch },
    ],
  },
  {
    section: "Système",
    items: [
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

interface SidebarNavProps {
  user?: { name: string; role: string };
  className?: string;
}

export function SidebarNav({ user, className }: SidebarNavProps) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "w-60 shrink-0 bg-surface border-r border-border flex flex-col h-screen sticky top-0",
        className,
      )}
      aria-label="Navigation principale"
    >
      <Link
        href="/"
        className="px-5 py-4 flex items-center gap-3 border-b border-border-soft hover:bg-surface-hover transition-colors"
      >
        <div className="w-9 h-9 rounded-md border border-sentinel bg-sentinel-dim flex items-center justify-center text-sentinel">
          <Shield className="w-4 h-4" strokeWidth={2} />
        </div>
        <div>
          <div className="font-mono font-bold tracking-widest text-[14px]">
            SENTINEL<span className="text-sentinel">.DZ</span>
          </div>
          <div className="font-mono text-[10px] text-text-dim tracking-wider">
            SOUVERAIN · 2026
          </div>
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((sec) => (
          <div key={sec.section} className="mb-6">
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim px-3 mb-2">
              {sec.section}
            </div>
            <ul className="flex flex-col gap-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + "/") ||
                  false;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors",
                        active
                          ? "bg-sentinel-dim text-sentinel font-medium"
                          : "text-text-muted hover:bg-surface-hover hover:text-text",
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-mono bg-p1 text-white px-1.5 py-0.5 rounded-sm font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {user && (
        <div className="p-3 border-t border-border-soft flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vault to-whisper shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] truncate">{user.name}</div>
            <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider">
              {user.role}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
