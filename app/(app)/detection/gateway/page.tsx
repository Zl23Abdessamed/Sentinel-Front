"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/nav/Topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Mail, 
  Smartphone, 
  CheckCircle, 
  Search, 
  AlertTriangle, 
  ArrowLeft, 
  Lock, 
  RefreshCw, 
  ExternalLink,
  X,
  User,
  ShieldCheck,
  Key,
  Globe,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Database,
  Server
} from "lucide-react";
import Link from "next/link";

export default function GatewayPage() {
  const [workspaceConnected, setWorkspaceConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [emailsScanned, setEmailsScanned] = useState(1398);
  const [threats, setThreats] = useState<any[]>([]);
  const [showGoogleOAuth, setShowGoogleOAuth] = useState(false);
  const [oauthStep, setOauthStep] = useState<"select" | "consent" | "verifying" | "complete">("select");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [oauthError, setOauthError] = useState(false);
  const [showScopeDetails, setShowScopeDetails] = useState(false);

  const MOCK_GOOGLE_ACCOUNTS = [
    { email: "admin@company.dz", name: "Admin SecOps", avatar: "A" },
    { email: "security@company.dz", name: "Security Team", avatar: "S" },
    { email: "it-support@company.dz", name: "IT Support", avatar: "IT" },
  ];

  const GOOGLE_SCOPES = [
    { name: "Gmail Read Access", description: "Scan emails for threats", icon: Mail },
    { name: "Security Assessment", description: "Analyze attachments & links", icon: ShieldCheck },
    { name: "Account Metadata", description: "Profile & security settings", icon: User },
    { name: "Admin SDK Reports", description: "Audit logs & activity reports", icon: Database },
  ];

  // Simulate scanning counter
  useEffect(() => {
    if (!workspaceConnected) return;
    const interval = setInterval(() => {
      setEmailsScanned((prev) => prev + Math.floor(Math.random() * 3));
    }, 2500);
    return () => clearInterval(interval);
  }, [workspaceConnected]);

  // Automatically trigger a threat after connection
  useEffect(() => {
    if (workspaceConnected || waConnected) {
      const timer = setTimeout(() => {
        setThreats(prev => [
          {
            id: Date.now(),
            target: "sara@company.dz",
            vector: waConnected && !workspaceConnected ? "WhatsApp (Lookalike Link)" : "Email (Phishing)",
            action: "Auto-Quarantined",
            time: "À l'instant",
          },
          ...prev
        ]);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [workspaceConnected, waConnected]);

  const handleGoogleOAuth = () => {
    setShowGoogleOAuth(true);
    setOauthStep("select");
    setOauthError(false);
  };

  const handleAccountSelect = (email: string) => {
    setSelectedAccount(email);
    setOauthStep("consent");
  };

  const handleConsent = () => {
    setOauthStep("verifying");
    
    // Simulate OAuth verification process
    setTimeout(() => {
      setOauthStep("complete");
    }, 2000);
  };

  const handleCompleteOAuth = () => {
    setWorkspaceConnected(true);
    setShowGoogleOAuth(false);
    setOauthStep("select");
    setSelectedAccount("");
  };

  const handleCancelOAuth = () => {
    setShowGoogleOAuth(false);
    setOauthStep("select");
    setSelectedAccount("");
    setOauthError(false);
  };

  const handleRevokeAccess = () => {
    setWorkspaceConnected(false);
    setThreats([]);
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0a0f18] text-white">
      <Topbar title="Gateway & Communications" subtitle="Protection active en arrière-plan" />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full space-y-8 custom-scrollbar">
        <Link href="/detection" className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour au Radar
        </Link>

        {/* Google OAuth Modal */}
        {showGoogleOAuth && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              
              {/* Google-style header */}
              <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-8 h-8 text-blue-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {oauthStep === "select" && "Sign in with Google"}
                      {oauthStep === "consent" && "Google OAuth Consent"}
                      {oauthStep === "verifying" && "Verifying..."}
                      {oauthStep === "complete" && "Connected Successfully"}
                    </h2>
                    <p className="text-xs text-gray-500">security-dashboard.vercel.app</p>
                  </div>
                </div>
                <button 
                  onClick={handleCancelOAuth}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="border-b border-gray-200" />

              {/* Step 1: Account Selection */}
              {oauthStep === "select" && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600">Choose a Google Account to continue</p>
                  </div>
                  
                  {MOCK_GOOGLE_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      onClick={() => handleAccountSelect(account.email)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group border border-gray-200 hover:border-blue-300"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {account.avatar}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-500">{account.email}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </button>
                  ))}

                  <div className="flex items-center justify-center text-xs text-gray-400 gap-4 mt-4">
                    <button className="hover:text-blue-600">Create account</button>
                    <span>•</span>
                    <button className="hover:text-blue-600">Use another account</button>
                  </div>
                </div>
              )}

              {/* Step 2: OAuth Consent Screen */}
              {oauthStep === "consent" && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4" />
                    <span>Signed in as <strong>{selectedAccount}</strong></span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Security Dashboard</p>
                        <p className="text-xs text-gray-500">security-dashboard.vercel.app</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 font-medium">Will have access to:</p>

                    <div className="space-y-2">
                      {GOOGLE_SCOPES.map((scope) => {
                        const ScopeIcon = scope.icon;
                        return (
                          <div key={scope.name} className="flex items-start gap-2">
                            <ScopeIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-gray-700">{scope.name}</p>
                              <p className="text-xs text-gray-500">{scope.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setShowScopeDetails(!showScopeDetails)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      {showScopeDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showScopeDetails ? "Hide details" : "See details"}
                    </button>

                    {showScopeDetails && (
                      <div className="bg-white rounded p-3 text-xs text-gray-600 space-y-1 border border-gray-200">
                        <p className="font-medium text-gray-700">Additional permissions:</p>
                        <p>• View your email messages and settings</p>
                        <p>• Create, read, update, and delete emails</p>
                        <p>• Manage security and threat protection</p>
                        <p className="text-gray-400 mt-2">Google will share your info with this app</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleCancelOAuth}
                      variant="outline"
                      className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConsent}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Allow
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Verification */}
              {oauthStep === "verifying" && (
                <div className="p-12 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
                    <Lock className="w-6 h-6 text-blue-800 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">Verifying credentials...</p>
                  <p className="text-sm text-gray-500">Establishing secure OAuth 2.0 connection</p>
                  <div className="flex gap-2 mt-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              )}

              {/* Step 4: Complete */}
              {oauthStep === "complete" && (
                <div className="p-8 flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">Connected Successfully</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedAccount} now has Gmail protection
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Server className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">OAuth 2.0 Token Generated</span>
                  </div>
                  <Button
                    onClick={handleCompleteOAuth}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                  >
                    Return to Dashboard
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Settings / Integrations Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-[#0f172a] border-[#1e293b]">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold">Google Workspace</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">Sécurisez Gmail via OAuth 2.0.</p>
            
            {workspaceConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <span className="flex items-center gap-2 font-medium text-emerald-500">
                    <CheckCircle className="w-5 h-5" /> Connecté et Actif
                  </span>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono text-emerald-400">OAUTH2_ACTIVE</span>
                  </div>
                </div>
                <Button 
                  onClick={handleRevokeAccess}
                  variant="outline"
                  className="w-full bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Lock className="w-4 h-4 mr-2" /> Révoquer l'accès OAuth
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleGoogleOAuth}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
              >
                <Globe className="w-5 h-5" />
                Connect Google Workspace
              </Button>
            )}
          </Card>

          <Card className="p-6 bg-[#0f172a] border-[#1e293b]">
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold">Passerelle WhatsApp</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">Surveillez les flux WhatsApp Business.</p>
            
            {waConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <span className="flex items-center gap-2 font-medium text-emerald-500">
                    <CheckCircle className="w-5 h-5" /> Webhook Sécurisé
                  </span>
                  <span className="text-xs font-mono text-emerald-400">WH_ACTIVE</span>
                </div>
                <Button 
                  onClick={() => setWaConnected(false)}
                  variant="outline"
                  className="w-full bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Lock className="w-4 h-4 mr-2" /> Désactiver le Webhook
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="WhatsApp Business API Key..." 
                    className="w-full bg-[#1e293b] border-none rounded-md pl-10 pr-4 py-2 outline-none focus:ring-1 focus:ring-green-500 text-sm"
                  />
                </div>
                <Button 
                  onClick={() => setWaConnected(true)} 
                  className="w-full bg-green-600 hover:bg-green-500 text-white"
                >
                  Configurer le Webhook
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Dashboard / Visualization Section */}
        {(workspaceConnected || waConnected) && (
          <>
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <Card className="p-6 bg-[#0f172a] border-blue-500/30 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-4 mb-2">
                  <Search className="w-5 h-5 text-blue-500" />
                  <h3 className="text-gray-300 font-medium">Éléments Scannés Aujourd'hui</h3>
                </div>
                <div className="text-4xl font-bold font-mono tracking-tight text-white mt-4">
                  {emailsScanned.toLocaleString()}
                </div>
              </Card>

              <Card className="p-6 bg-[#0f172a] border-red-500/30 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-4 mb-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  <h3 className="text-gray-300 font-medium">Menaces Isolées</h3>
                </div>
                <div className="text-4xl font-bold font-mono tracking-tight text-red-500 mt-4">
                  {threats.length + 3}
                </div>
              </Card>
            </div>

            {/* Live Threat Feed */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Live Threat Feed
              </h3>
              
              <div className="space-y-4">
                {threats.map(threat => (
                  <Card key={threat.id} className="p-0 overflow-hidden border-red-500/50 bg-[#150a0a] animate-in slide-in-from-top-4 fade-in duration-300 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                    <div className="bg-red-500 text-white text-xs font-bold px-4 py-2 flex items-center justify-between uppercase tracking-wider">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Phishing Attempt Blocked!
                      </span>
                      <span>{threat.time}</span>
                    </div>
                    <div className="p-5 font-mono text-sm space-y-3">
                      <div className="flex border-b border-red-500/20 pb-3">
                        <span className="text-red-400 w-32 shrink-0">Cible:</span>
                        <span className="text-white">{threat.target}</span>
                      </div>
                      <div className="flex border-b border-red-500/20 pb-3">
                        <span className="text-red-400 w-32 shrink-0">Vecteur:</span>
                        <span className="text-orange-300">{threat.vector}</span>
                      </div>
                      <div className="flex">
                        <span className="text-red-400 w-32 shrink-0">Action:</span>
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                          {threat.action}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Always-on historical mock threat */}
                <Card className="p-0 overflow-hidden border-orange-500/30 bg-[#1a1310] opacity-80">
                  <div className="bg-orange-500/80 text-white text-xs font-bold px-4 py-2 flex items-center justify-between uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Malware Isolé
                    </span>
                    <span>Il y a 3 heures</span>
                  </div>
                  <div className="p-5 font-mono text-sm space-y-3">
                    <div className="flex border-b border-orange-500/20 pb-3">
                      <span className="text-orange-400 w-32 shrink-0">Cible:</span>
                      <span className="text-gray-300">finance@company.dz</span>
                    </div>
                    <div className="flex border-b border-orange-500/20 pb-3">
                      <span className="text-orange-400 w-32 shrink-0">Vecteur:</span>
                      <span className="text-gray-300">Email (Pièce jointe .exe)</span>
                    </div>
                    <div className="flex">
                      <span className="text-orange-400 w-32 shrink-0">Action:</span>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        Auto-Quarantined
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Security Status */}
        {(workspaceConnected || waConnected) && (
          <Card className="p-6 bg-[#0f172a] border-[#1e293b] mt-8">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold">Security Status</h3>
            </div>
            <div className="space-y-3">
              {workspaceConnected && (
                <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">Google Workspace Protection</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">Active</span>
                </div>
              )}
              {waConnected && (
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">WhatsApp Gateway Monitor</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">Active</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Threat Intelligence Feed</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">Connected</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}