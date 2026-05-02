"use client";

import { useState } from "react";
import { Topbar } from "@/components/nav/Topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Server,
  Activity,
  ShieldAlert,
  ArrowLeft,
  Loader2,
  FolderClosed,
  User,
  Download,
  Unlock,
  Key,
  Terminal,
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Wifi,
  Database
} from "lucide-react";
import Link from "next/link";

type AuthMethod = "ssh" | "token";

export default function AuditPage() {
  const [deployState, setDeployState] = useState<"idle" | "loading" | "connected">("idle");
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("ssh");
  const [sshKey, setSshKey] = useState("");
  const [serverIp, setServerIp] = useState("192.168.1.100");
  const [showKey, setShowKey] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [keyStrength, setKeyStrength] = useState<"none" | "weak" | "strong">("none");

  const validateSSHKey = (key: string) => {
    // Basic SSH key validation
    if (key.length === 0) {
      setKeyStrength("none");
      setValidationError("");
      return;
    }

    const hasValidHeader = key.includes("BEGIN") && key.includes("PRIVATE KEY");
    const isRSA = key.includes("RSA");
    const isED25519 = key.includes("ED25519");
    const hasValidFooter = key.includes("END") && key.includes("PRIVATE KEY");

    if (hasValidHeader && hasValidFooter) {
      if (isRSA && key.length < 1000) {
        setKeyStrength("weak");
        setValidationError("RSA key seems too short. Use 4096-bit or higher for security.");
      } else if (isED25519) {
        setKeyStrength("strong");
        setValidationError("");
      } else if (isRSA) {
        setKeyStrength("strong");
        setValidationError("");
      } else {
        setKeyStrength("weak");
        setValidationError("Unrecognized key type. Recommended: ED25519 or RSA 4096-bit");
      }
    } else if (key.length > 0) {
      setKeyStrength("weak");
      setValidationError("Invalid SSH key format. Expected PEM format with header/footer.");
    }
  };

  const handleDeploy = () => {
    if (!sshKey.trim() && authMethod === "ssh") {
      setValidationError("SSH key is required for authentication");
      return;
    }

    if (!serverIp.trim()) {
      setValidationError("Server IP address is required");
      return;
    }

    setDeployState("loading");
    setValidationError("");

    setTimeout(() => {
      setDeployState("connected");

      // Start showing timeline events progressively after short delays
      setTimeout(() => {
        setTimelineEvents(prev => [...prev, {
          id: 1,
          time: "03:14 AM",
          level: "warning",
          icon: User,
          text: "Ahmed s'est connecté au serveur. (Heure inhabituelle)",
          color: "text-yellow-500",
          bg: "bg-yellow-500",
        }]);
      }, 1000);

      setTimeout(() => {
        setTimelineEvents(prev => [...prev, {
          id: 2,
          time: "03:15 AM",
          level: "low",
          icon: FolderClosed,
          text: "Ahmed a accédé au fichier Finance_Q3.pdf.",
          color: "text-emerald-500",
          bg: "bg-emerald-500",
        }]);
      }, 2500);

      setTimeout(() => {
        setTimelineEvents(prev => [...prev, {
          id: 3,
          time: "03:16 AM",
          level: "warning",
          icon: Download,
          text: "Ahmed a téléchargé 50 fichiers en 1 minute.",
          color: "text-yellow-500",
          bg: "bg-yellow-500",
        }]);
      }, 4000);

      setTimeout(() => {
        setTimelineEvents(prev => [...prev, {
          id: 4,
          time: "03:17 AM",
          level: "critical",
          icon: Unlock,
          text: "Ahmed a ouvert Admin_Passwords.xlsx (Honeypot/Leurre de sécurité).",
          color: "text-red-500",
          bg: "bg-red-500",
        }]);
      }, 6000);

      setTimeout(() => {
        setTimelineEvents(prev => [...prev, {
          id: 5,
          time: "03:17 AM",
          level: "system",
          icon: ShieldAlert,
          text: "AI ALERT: Exfiltration massive détectée. Verrouillage automatique du compte.",
          color: "text-purple-500",
          bg: "bg-purple-500",
          highlightCard: true,
        }]);
      }, 7000);

    }, 2000);
  };

  const handleDisconnect = () => {
    setDeployState("idle");
    setTimelineEvents([]);
    setSshKey("");
    setValidationError("");
    setKeyStrength("none");
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0a0f18] text-white">
      <Topbar title="Audit & Fichiers" subtitle="Comportement et Honeypots" />

      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-10 custom-scrollbar">
        <Link href="/detection" className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour au Radar
        </Link>

        {/* Monitored Directories */}
        <Card className="p-6 bg-[#0f172a] border-[#1e293b]">
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold">Répertoires Sécurisés</h2>
          </div>
          <p className="text-sm text-gray-400 mb-6">
            Déployez l'agent de surveillance logicielle pour obtenir la visibilité sur Server_A.
          </p>

          {deployState === "idle" && (
            <div className="space-y-6">
              {/* Authentication Method Selection */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-3 block">
                  Méthode d'authentification
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAuthMethod("ssh");
                      setValidationError("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${authMethod === "ssh"
                        ? "bg-purple-600/20 text-purple-400 border border-purple-500/50"
                        : "bg-[#1e293b] text-slate-500 border border-transparent hover:text-slate-300 hover:border-slate-700"
                      }`}
                  >
                    <Terminal className="w-4 h-4" />
                    SSH Key
                  </button>
                  <button
                    onClick={() => {
                      setAuthMethod("token");
                      setValidationError("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${authMethod === "token"
                        ? "bg-purple-600/20 text-purple-400 border border-purple-500/50"
                        : "bg-[#1e293b] text-slate-500 border border-transparent hover:text-slate-300 hover:border-slate-700"
                      }`}
                  >
                    <Key className="w-4 h-4" />
                    API Token
                  </button>
                </div>
              </div>

              {/* Server IP Input */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Server IP Address
                </label>
                <div className="relative">
                  <Wifi className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    placeholder="192.168.1.100 or server-a.internal"
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500/50 text-sm font-mono text-slate-300 placeholder:text-slate-600"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Default: 192.168.1.100 (Server_A)</p>
              </div>

              {/* SSH Key Input */}
              {authMethod === "ssh" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">
                      SSH Private Key
                    </label>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
                    >
                      {showKey ? (
                        <><EyeOff className="w-3 h-3" /> Hide</>
                      ) : (
                        <><Eye className="w-3 h-3" /> Show</>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={sshKey}
                    onChange={(e) => {
                      setSshKey(e.target.value);
                      validateSSHKey(e.target.value);
                    }}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                    className={`w-full bg-[#1e293b] border rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-purple-500 text-sm font-mono text-slate-300 resize-none h-32 placeholder:text-slate-600 ${keyStrength === "strong"
                        ? "border-emerald-500/50 focus:border-emerald-500"
                        : keyStrength === "weak"
                          ? "border-yellow-500/50 focus:border-yellow-500"
                          : validationError
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-slate-700"
                      }`}
                    spellCheck="false"
                  />

                  {/* Key Strength Indicator */}
                  {keyStrength !== "none" && (
                    <div className="mt-2 flex items-center gap-2">
                      {keyStrength === "strong" ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-emerald-400 font-medium">Strong SSH Key</span>
                          <Shield className="w-3 h-3 text-emerald-400" />
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs text-yellow-400">{validationError}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* SSH Info */}
                  <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-blue-400 mt-0.5" />
                      <div className="text-xs text-gray-400 space-y-1">
                        <p><strong className="text-blue-400">SSH Key Authentication</strong></p>
                        <p>• Supported formats: ED25519, RSA (4096-bit recommended)</p>
                        <p>• Key will be stored in memory only during session</p>
                        <p>• Connection will be established via port 22</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* API Token Input */}
              {authMethod === "token" && (
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    API Token
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      type={showKey ? "text" : "password"}
                      value={sshKey}
                      onChange={(e) => setSshKey(e.target.value)}
                      placeholder="glpat-xxxxxxxxxxxxx"
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-lg pl-10 pr-12 py-3 outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500/50 text-sm font-mono text-slate-300 placeholder:text-slate-600"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showKey ? (
                        <EyeOff className="w-4 h-4 text-gray-500 hover:text-gray-300" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500 hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Validation Error */}
              {validationError && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  {validationError}
                </div>
              )}

              {/* Deploy Button */}
              <Button
                onClick={handleDeploy}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-mono py-6"
              >
                <Terminal className="w-4 h-4 mr-2" />
                Deploy Monitoring Agent to Server_A
              </Button>
            </div>
          )}

          {deployState === "loading" && (
            <div className="space-y-4">
              <Button disabled className="w-full bg-[#1e293b] text-white font-mono cursor-not-allowed py-6">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Déploiement en cours...
              </Button>

              <div className="p-4 bg-[#1e293b] rounded-lg border border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-sm text-gray-300">Authenticating via {authMethod === "ssh" ? "SSH Key" : "API Token"}...</span>
                </div>
                <div className="space-y-2 text-xs font-mono text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="w-16">[INFO]</span>
                    <span>Establishing secure connection to {serverIp}:22</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16">[INFO]</span>
                    <span>Verifying {authMethod === "ssh" ? "SSH key fingerprint" : "API token signature"}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16">[INFO]</span>
                    <span>Deploying monitoring agent v4.1...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {deployState === "connected" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-md font-mono text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected (Agent v4.1 Active)
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  {serverIp}:22 • {authMethod === "ssh" ? "SSH Authenticated" : "Token Authenticated"}
                </div>
              </div>

              {/* Connection Details */}
              <div className="p-4 bg-[#1e293b] rounded-lg border border-slate-700">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Server:</span>
                    <span className="text-gray-300 ml-2 font-mono">Server_A ({serverIp})</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Auth:</span>
                    <span className="text-emerald-400 ml-2 font-mono">
                      {authMethod === "ssh" ? "SSH Key Pair" : "API Token"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Agent:</span>
                    <span className="text-gray-300 ml-2 font-mono">v4.1.2</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Uptime:</span>
                    <span className="text-gray-300 ml-2 font-mono">Just now</span>
                  </div>
                </div>

                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full mt-4 bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-sm"
                >
                  <Lock className="w-4 h-4 mr-2" /> Disconnect & Clear Session
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Behavioral Timeline */}
        {deployState === "connected" && (
          <div>
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-500" />
              Behavioral Timeline
            </h3>

            <div className="relative border-l-2 border-slate-700 ml-4 space-y-8 pb-12">
              {timelineEvents.map((evt, i) => {
                const Icon = evt.icon;
                return (
                  <div key={evt.id} className="relative pl-8 animate-in slide-in-from-left-4 fade-in duration-500">
                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full ${evt.bg} border-4 border-[#0a0f18] z-10`}></div>

                    {!evt.highlightCard ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group">
                        <span className="text-xs font-mono text-slate-400 bg-slate-800/50 px-2 py-1 rounded w-fit">{evt.time}</span>
                        <div className="flex items-center gap-3 bg-[#0f172a] border border-slate-800 px-4 py-3 rounded-lg flex-1 group-hover:border-slate-600 transition-colors">
                          <Icon className={`w-5 h-5 ${evt.color} shrink-0`} />
                          <span className={`${evt.level === "critical" ? "text-red-400 font-bold" : "text-slate-300"}`}>{evt.text}</span>
                        </div>
                      </div>
                    ) : (
                      <Card className="p-5 bg-gradient-to-r from-red-950 to-[#0f172a] border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)] ml-0 mt-4">
                        <div className="flex gap-4">
                          <div className="p-3 bg-red-500/20 rounded-full h-fit">
                            <Icon className="w-6 h-6 text-red-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs font-mono text-red-300">{evt.time}</span>
                              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-red-500 text-white rounded">Action System</span>
                            </div>
                            <p className="text-red-100 font-medium text-lg leading-relaxed">{evt.text}</p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
            {timelineEvents.length === 0 && (
              <div className="text-gray-500 italic ml-4">En attente des premiers flux d'audit...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}