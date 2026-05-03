"use client";

import { useEffect, useState, useRef } from "react";
import {
  Shield,
  MessageCircle,
  Sparkles,
  ShieldAlert,
  FileSearch,
  Globe,
  Eye,
  ArrowRight,
  ArrowLeft,
  Mail,
  Wifi,
  MousePointer,
  Lock,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Menu,
  X,
  ChevronDown,
  Bot,
  Database,
  Zap,
  Users,
  BarChart3,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge: string;
  accent: "sentinel" | "classifier" | "vault" | "crisis";
}

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const STATS = [
  { value: "10 min", label: "Safe Harbor Window" },
  { value: "24/7", label: "AI Monitoring" },
  { value: "SHA-256", label: "Tamper-Proof Logs" },
  { value: "Law 18-07", label: "Fully Compliant" },
];

const FEATURES_AI: Feature[] = [
  {
    icon: <Mail className="w-6 h-6" strokeWidth={1.6} />,
    title: "Phishing Catcher",
    desc: "An email and WhatsApp gateway scanner that uses AI to detect and block malicious links and spoofed emails before the employee even reads them. Zero exposure by design.",
    badge: "AI · Email & WhatsApp",
    accent: "sentinel",
  },
  {
    icon: <Database className="w-6 h-6" strokeWidth={1.6} />,
    title: "Data Watchdog",
    desc: "AI that silently monitors server access logs 24/7. If an account suddenly attempts to download 500 sensitive files at 3 AM, it auto-freezes the account instantly — no human needed.",
    badge: "AI Log Monitor",
    accent: "classifier",
  },
  {
    icon: <Wifi className="w-6 h-6" strokeWidth={1.6} />,
    title: "Intruder Radar",
    desc: "Continuous network scanner sweeping company Wi-Fi in real time. Any unknown or rogue device connecting to the network is flagged and quarantined within seconds.",
    badge: "Network Scanner",
    accent: "vault",
  },
];

const FEATURES_HUMAN: Feature[] = [
  {
    icon: <Zap className="w-6 h-6" strokeWidth={1.6} />,
    title: "1-Click Panic Button",
    desc: "A desktop widget letting any employee report a suspicious event instantly. It captures screenshots and device metadata automatically — no technical skills required whatsoever.",
    badge: "Desktop Widget",
    accent: "sentinel",
  },
  {
    icon: <MessageCircle className="w-6 h-6" strokeWidth={1.6} />,
    title: "WhatsApp Reporting Bot",
    desc: "Employees can report incidents directly via WhatsApp or Telegram using simple voice notes or text messages. Meets people where they already are.",
    badge: "WhatsApp · Telegram",
    accent: "classifier",
  },
  {
    icon: <Shield className="w-6 h-6" strokeWidth={1.6} />,
    title: "Safe Harbor Policy",
    desc: "A psychological safety guarantee: zero penalties if an employee reports their own mistake within 10 minutes of occurrence. Silence costs more than honesty.",
    badge: "10-min Grace Period",
    accent: "vault",
  },
];

const FEATURES_RESPONSE: Feature[] = [
  {
    icon: <BookOpen className="w-6 h-6" strokeWidth={1.6} />,
    title: "Automated Incident Playbooks",
    desc: "Smart decision trees grade each incident in real time, triggering automated containment actions — locking a lost laptop, blocking an account — plus SMS escalations to the right team.",
    badge: "Auto-Containment",
    accent: "crisis",
  },
  {
    icon: <Lock className="w-6 h-6" strokeWidth={1.6} />,
    title: "Cryptographic Black Box",
    desc: "Blockchain-inspired, tamper-proof SHA-256 audit trails for every incident. Every action is sealed and verifiable — prove legal compliance to any regulator in one click.",
    badge: "SHA-256 · Append-Only",
    accent: "vault",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Employee Detects Threat",
    desc: "An employee clicks a suspicious link, or AI detects anomalous log behavior. Either way, the event is captured immediately.",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  {
    step: "02",
    title: "Instant Safe Reporting",
    desc: "Via Panic Button, WhatsApp bot, or automatic AI trigger — the incident is logged with full context inside the 10-minute safe harbor window.",
    icon: <MessageCircle className="w-5 h-5" />,
  },
  {
    step: "03",
    title: "AI Classifies & Debates",
    desc: "Two AI agents — Classifier and Counter-Auditor — debate the severity in real time, applying Law 18-07 compliance checks automatically.",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    step: "04",
    title: "Automated Response",
    desc: "Playbooks fire instantly: freeze accounts, lock devices, notify responders via SMS, and open a forensic incident thread with full evidence chain.",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    step: "05",
    title: "Sealed Audit Trail",
    desc: "Every action is written to a tamper-proof SHA-256 Black Box. Regulators and magistrates receive a one-click compliance report.",
    icon: <FileSearch className="w-5 h-5" />,
  },
];

const TEAM = [
  { name: "Amine Benali", role: "CEO & Security Architect", initials: "AB" },
  { name: "Sarra Hadj", role: "AI/ML Lead", initials: "SH" },
  { name: "Yacine Mansouri", role: "Backend & Compliance", initials: "YM" },
  { name: "Lina Ouari", role: "UX & Product Design", initials: "LO" },
];

// ─── Accent map ───────────────────────────────────────────────────────────────

const ACCENT = {
  sentinel: {
    bg: "bg-sentinel-dim",
    border: "border-sentinel/40",
    text: "text-sentinel",
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, transparent 60%)",
  },
  classifier: {
    bg: "bg-[rgba(6,182,212,0.12)]",
    border: "border-classifier/40",
    text: "text-classifier",
    gradient: "linear-gradient(135deg, rgba(6,182,212,0.18) 0%, transparent 60%)",
  },
  vault: {
    bg: "bg-vault-dim",
    border: "border-vault/40",
    text: "text-vault",
    gradient: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, transparent 60%)",
  },
  crisis: {
    bg: "bg-[rgba(239,68,68,0.12)]",
    border: "border-p1/50",
    text: "text-p1",
    gradient: "linear-gradient(135deg, rgba(239,68,68,0.20) 0%, rgba(28,7,7,0.4) 100%)",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sentinel-dim border border-sentinel/40 text-sentinel font-mono text-[11px] font-semibold uppercase tracking-[0.1em] mb-5">
      {children}
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const a = ACCENT[feature.accent];
  return (
    <div
      className={cn(
        "group relative bg-surface border rounded-lg p-5 overflow-hidden transition-all duration-300 hover:border-border-soft",
        a.border
      )}
      style={{ background: a.gradient }}
    >
      <div
        className={cn(
          "w-11 h-11 rounded-md flex items-center justify-center border mb-4",
          a.bg,
          a.border,
          a.text
        )}
      >
        {feature.icon}
      </div>
      <div className={cn("font-mono text-[9px] uppercase tracking-[0.12em] mb-2", a.text)}>
        {feature.badge}
      </div>
      <h3 className="text-[16px] font-semibold text-text mb-2">{feature.title}</h3>
      <p className="text-[13px] text-text-muted leading-relaxed">{feature.desc}</p>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border-soft"
          : "bg-transparent"
      )}
    >
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-md border border-sentinel bg-sentinel-dim flex items-center justify-center text-sentinel transition-colors group-hover:bg-sentinel group-hover:text-black">
            <Shield className="w-4 h-4" strokeWidth={2} />
          </div>
          <span className="font-mono font-bold tracking-widest text-[15px]">
            SENTINEL<span className="text-sentinel">.DZ</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <button
              key={l.label}
              onClick={() => handleNav(l.href)}
              className="px-4 py-2 font-mono text-[12px] uppercase tracking-wider text-text-muted hover:text-text transition-colors rounded-md hover:bg-surface-2"
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            System Live
          </span>
          <a
            href="/auth/login"
            className="px-4 py-2 bg-sentinel text-black font-mono text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-amber-400 transition-colors"
          >
            Login
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md border border-border-soft text-text-muted"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border-soft bg-background/95 backdrop-blur-md">
          <div className="max-w-[1280px] mx-auto px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <button
                key={l.label}
                onClick={() => handleNav(l.href)}
                className="text-left px-4 py-3 font-mono text-[13px] uppercase tracking-wider text-text-muted hover:text-text rounded-md hover:bg-surface-2 transition-colors"
              >
                {l.label}
              </button>
            ))}
            <div className="pt-3 border-t border-border-soft mt-2 flex flex-col gap-2">
              <a
                href="/auth/login"
                className="block text-center px-4 py-2.5 bg-sentinel text-black font-mono text-[12px] font-bold uppercase tracking-wider rounded-md"
              >
                Login
              </a>
              <a
                href="#contact"
                onClick={(e) => { e.preventDefault(); handleNav("#contact"); }}
                className="block text-center px-4 py-2.5 border border-border-soft text-text font-mono text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-surface-2"
              >
                Request Demo
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const handleScroll = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-20 overflow-hidden">
      {/* Background */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(245,158,11,0.10), transparent 60%), radial-gradient(ellipse 50% 40% at 50% 85%, rgba(99,102,241,0.07), transparent 60%)",
        }}
      />
      {/* Grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-[900px] mx-auto px-6 text-center">
        <SectionLabel>▸ Cybersecurity Platform · Algeria · Law 18-07 Compliant</SectionLabel>

        <h1 className="text-[48px] sm:text-[64px] md:text-[96px] font-extrabold leading-[0.95] tracking-[-0.03em] mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          SENTINEL.DZ
        </h1>

        <p className="text-[18px] sm:text-[20px] md:text-[24px] font-semibold text-sentinel mb-4 tracking-tight">
          Turn Fearful Employees Into Active Threat Sensors
        </p>

        <p className="text-[16px] text-text-muted max-w-2xl mx-auto leading-relaxed mb-10">
          The Silent Fracture costs companies millions — when employees fear reporting mistakes, 
          hackers have hours to destroy your network. Sentinel.DZ bridges{" "}
          <strong className="text-text">psychological safety</strong> with{" "}
          <strong className="text-text">automated AI defense</strong>, closing the gap before 
          regulators arrive.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-14">
          <button
            onClick={() => handleScroll("#features")}
            className="px-6 py-3 bg-sentinel text-black font-mono text-[13px] font-bold uppercase tracking-wider rounded-md hover:bg-amber-400 transition-colors flex items-center gap-2"
          >
            Explore Features <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll("#how-it-works")}
            className="px-6 py-3 border border-border-soft bg-surface text-text font-mono text-[13px] uppercase tracking-wider rounded-md hover:border-sentinel/50 transition-colors"
          >
            How It Works
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[720px] mx-auto">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-surface border border-border-soft rounded-lg py-4 px-3"
            >
              <div className="font-mono text-[22px] font-extrabold text-sentinel mb-1 tabular-nums">
                {s.value}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-text-dim font-mono text-[10px] uppercase tracking-wider animate-bounce">
        <ChevronDown className="w-4 h-4" />
        <span>Scroll</span>
      </div>
    </section>
  );
}

// ─── The Problem ──────────────────────────────────────────────────────────────

function Problem() {
  return (
    <section className="py-20 border-t border-border-soft relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 40% 60% at 0% 50%, rgba(239,68,68,0.05), transparent 60%)",
        }}
      />
      <div className="relative z-10 max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <SectionLabel>▸ The Core Problem</SectionLabel>
            <h2 className="text-[36px] sm:text-[42px] md:text-[48px] font-extrabold leading-[1.05] tracking-[-0.025em] text-text mb-6">
              The Silent<br />
              <span className="text-p1">Fracture</span>
            </h2>
            <p className="text-[16px] text-text-muted leading-relaxed mb-5">
              Most massive cyber disasters don't happen because hackers are geniuses. 
              They happen because of <strong className="text-text">human psychology</strong>.
            </p>
            <p className="text-[16px] text-text-muted leading-relaxed mb-5">
              When an employee clicks a phishing link or loses a device, they are 
              terrified of being fired — so they stay silent. This silence gives 
              hackers hours or days to move laterally, exfiltrate data, and 
              destroy your network.
            </p>
            <p className="text-[16px] text-text-muted leading-relaxed">
              In Algeria, this also exposes organizations to severe fines under{" "}
              <strong className="text-sentinel">Law 18-07</strong> on personal 
              data protection — which requires mandatory incident reporting within 
              72 hours.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: <AlertTriangle className="w-4 h-4" />,
                color: "text-p1",
                bg: "bg-[rgba(239,68,68,0.1)]",
                border: "border-p1/30",
                title: "Employee stays silent",
                desc: "Fear of consequences delays reporting by hours or days.",
              },
              {
                icon: <Eye className="w-4 h-4" />,
                color: "text-amber-400",
                bg: "bg-sentinel-dim",
                border: "border-sentinel/30",
                title: "Attacker moves freely",
                desc: "Every silent hour is time the attacker uses to expand access.",
              },
              {
                icon: <ShieldAlert className="w-4 h-4" />,
                color: "text-vault",
                bg: "bg-vault-dim",
                border: "border-vault/30",
                title: "Regulators arrive",
                desc: "Law 18-07 fines land. The breach is now a legal catastrophe.",
              },
              {
                icon: <CheckCircle className="w-4 h-4" />,
                color: "text-success",
                bg: "bg-[rgba(34,197,94,0.1)]",
                border: "border-success/30",
                title: "Sentinel.DZ breaks the cycle",
                desc: "Safe reporting + automated AI detection closes the gap instantly.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border",
                  item.bg,
                  item.border
                )}
              >
                <div className={cn("mt-0.5 flex-shrink-0", item.color)}>
                  {item.icon}
                </div>
                <div>
                  <div className={cn("font-mono text-[12px] font-semibold mb-0.5", item.color)}>
                    {item.title}
                  </div>
                  <div className="text-[13px] text-text-muted">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="py-20 border-t border-border-soft">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Category 1 */}
        <div className="mb-16">
          <div className="mb-8">
            <SectionLabel>▸ Category 01 · AI Detection</SectionLabel>
            <h2 className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.02em] text-text mb-3">
              Proactive AI Detection
            </h2>
            <p className="text-[15px] text-text-muted max-w-xl">
              Catching threats automatically, before any human is even aware — 24/7, 
              zero fatigue, zero blind spots.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES_AI.map((f) => <FeatureCard key={f.title} feature={f} />)}
          </div>
        </div>

        {/* Category 2 */}
        <div className="mb-16">
          <div className="mb-8">
            <SectionLabel>▸ Category 02 · Human Layer</SectionLabel>
            <h2 className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.02em] text-text mb-3">
              Frictionless & Fearless Reporting
            </h2>
            <p className="text-[15px] text-text-muted max-w-xl">
              Solving the human problem. Making reporting easier and safer than staying 
              silent — across every channel employees already use.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES_HUMAN.map((f) => <FeatureCard key={f.title} feature={f} />)}
          </div>
        </div>

        {/* Category 3 */}
        <div>
          <div className="mb-8">
            <SectionLabel>▸ Category 03 · Automated Response</SectionLabel>
            <h2 className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.02em] text-text mb-3">
              Automated Response & Compliance
            </h2>
            <p className="text-[15px] text-text-muted max-w-xl">
              Solving the IT bottleneck. Containment fires automatically. Compliance 
              is built in — not bolted on.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[860px]">
            {FEATURES_RESPONSE.map((f) => <FeatureCard key={f.title} feature={f} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 border-t border-border-soft relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(245,158,11,0.06), transparent 60%)",
        }}
      />
      <div className="relative z-10 max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-14">
          <SectionLabel>▸ The Flow</SectionLabel>
          <h2 className="text-[36px] md:text-[48px] font-extrabold tracking-[-0.025em] text-text mb-4">
            How It Works
          </h2>
          <p className="text-[16px] text-text-muted max-w-lg mx-auto">
            From the moment a threat is detected to a sealed, court-ready audit trail — 
            fully automated in minutes.
          </p>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div
            aria-hidden
            className="hidden md:block absolute top-[52px] left-[calc(10%+28px)] right-[calc(10%+28px)] h-[2px] opacity-20"
            style={{
              background:
                "linear-gradient(90deg, var(--sentinel), var(--classifier), var(--vault))",
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 md:gap-4 lg:gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="flex flex-col items-center text-center">
                <div className="relative w-14 h-14 rounded-xl border border-sentinel/40 bg-sentinel-dim flex items-center justify-center text-sentinel mb-4 z-10">
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-background border border-sentinel/60 flex items-center justify-center font-mono text-[9px] font-bold text-sentinel">
                    {i + 1}
                  </div>
                </div>
                <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider mb-2">
                  Step {step.step}
                </div>
                <h3 className="text-[14px] font-semibold text-text mb-2">{step.title}</h3>
                <p className="text-[12px] text-text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────

function About() {
  return (
    <section id="about" className="py-20 border-t border-border-soft">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          <div>
            <SectionLabel>▸ About Us</SectionLabel>
            <h2 className="text-[36px] md:text-[48px] font-extrabold tracking-[-0.025em] text-text leading-[1.05] mb-6">
              Built for Algeria.<br />
              <span className="text-sentinel">Built to Last.</span>
            </h2>
            <p className="text-[16px] text-text-muted leading-relaxed mb-5">
              Sentinel.DZ was born from a simple observation: Algeria's growing 
              digital economy deserves a cybersecurity platform built for its 
              unique legal, cultural, and organizational context — not a translated 
              Western product.
            </p>
            <p className="text-[16px] text-text-muted leading-relaxed mb-5">
              We are a team of Algerian engineers and security researchers competing 
              at <strong className="text-sentinel">Innobyte 2.0</strong>, building 
              a sovereign, AI-native incident response platform that is 100% 
              compliant with Law 18-07 and Decree 26-07.
            </p>
            <p className="text-[16px] text-text-muted leading-relaxed mb-8">
              Our mission: transform every employee from a potential liability into 
              an active defender — no matter their technical background, language, 
              or role.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "100% Sovereign", desc: "No foreign cloud dependency" },
                { label: "AI-Native", desc: "Debate-based classification engine" },
                { label: "Privacy First", desc: "k-anonymous ≥ 50, zero PII by default" },
                { label: "Law 18-07", desc: "72h reporting, Art. 41 compliant" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-4 bg-surface border border-border-soft rounded-lg"
                >
                  <div className="font-mono text-[12px] font-bold text-sentinel mb-1">
                    {item.label}
                  </div>
                  <div className="text-[12px] text-text-muted">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div>
            <h3 className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-dim mb-6">
              The Team
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="p-5 bg-surface border border-border-soft rounded-lg hover:border-sentinel/40 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-sentinel-dim border border-sentinel/40 flex items-center justify-center font-mono text-[14px] font-bold text-sentinel mb-3 group-hover:bg-sentinel group-hover:text-black transition-colors">
                    {member.initials}
                  </div>
                  <div className="text-[14px] font-semibold text-text mb-0.5">
                    {member.name}
                  </div>
                  <div className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                    {member.role}
                  </div>
                </div>
              ))}
            </div>

            {/* Innobyte badge */}
            <div className="mt-6 p-4 bg-surface border border-sentinel/30 rounded-lg flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-sentinel-dim border border-sentinel/40 flex items-center justify-center text-sentinel flex-shrink-0">
                <Globe className="w-6 h-6" strokeWidth={1.6} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-text mb-0.5">
                  Innobyte 2.0 · Problem #2
                </div>
                <div className="font-mono text-[11px] text-text-muted">
                  National cybersecurity challenge · Algeria · 2026
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const handleNav = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="border-t border-border-soft bg-surface/50">
      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-md border border-sentinel bg-sentinel-dim flex items-center justify-center text-sentinel">
                <Shield className="w-4 h-4" strokeWidth={2} />
              </div>
              <span className="font-mono font-bold tracking-widest text-[15px]">
                SENTINEL<span className="text-sentinel">.DZ</span>
              </span>
            </div>
            <p className="text-[13px] text-text-muted leading-relaxed max-w-[300px] mb-5">
              A socio-technical cybersecurity platform that bridges psychological 
              safety with automated AI defense — built sovereign, for Algeria.
            </p>
           
          </div>

          {/* Platform links */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-dim mb-4">
              Platform
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Features", href: "#features" },
                { label: "How It Works", href: "#how-it-works" },
                { label: "Safe Harbor Policy", href: "#features" },
                { label: "Black Box Logging", href: "#features" },
                { label: "Request Demo", href: "#contact" },
              ].map((l) => (
                <button
                  key={l.label}
                  onClick={() => handleNav(l.href)}
                  className="block font-mono text-[12px] text-text-muted hover:text-text transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-dim mb-4">
              Compliance
            </div>
            <div className="space-y-2.5">
              {[
                "Law 18-07 · Data Protection",
                "Decree 26-07",
                "72h Incident Reporting",
                "Art. 41 — Audit Trails",
                "SHA-256 · Append-Only",
              ].map((item) => (
                <div key={item} className="font-mono text-[12px] text-text-muted">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border-soft flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="font-mono text-[11px] text-text-dim">
            © 2026 Sentinel.DZ · All rights reserved · Innobyte 2.0 · Problem #2
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-text-dim">
            <span className="flex items-center gap-1.5 text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              System Operational
            </span>
            <span>·</span>
            <span>100% Sovereign</span>
            <span>·</span>
            <span>Audit AI Triangulated</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen relative bg-background">
      <Navbar />
      <Hero />
      <Problem />
      <Features />
      <HowItWorks />
      <About />
      <Footer />
    </div>
  );
}