"use client";

import { useState } from "react";
import { Topbar } from "@/components/nav/Topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, Search, Shield, Laptop, Monitor, Smartphone, AlertTriangle, ShieldOff, ArrowLeft, Key, Network, Terminal } from "lucide-react";
import Link from "next/link";

type KeyType = "ip" | "ssh" | "token";

interface Device {
  id: string;
  name: string;
  ip: string;
  mac: string;
  type: "laptop" | "desktop" | "mobile" | "unknown";
  isRogue: boolean;
}

const MOCK_DEVICES: Device[] = [
  { id: "1", name: "Manager's iPhone", ip: "192.168.1.101", mac: "AA:BB:CC:DD:EE:01", type: "mobile", isRogue: false },
  { id: "2", name: "Finance Desktop (PC-04)", ip: "192.168.1.102", mac: "11:22:33:44:55:66", type: "desktop", isRogue: false },
  { id: "3", name: "Admin Surface Pro", ip: "192.168.1.105", mac: "F1:F2:F3:F4:F5:F6", type: "laptop", isRogue: false },
  { id: "4", name: "Unknown Device (Kali Linux)", ip: "192.168.1.189", mac: "00:00:00:00:11:11", type: "unknown", isRogue: true },
  { id: "5", name: "Printer HP-202", ip: "192.168.1.200", mac: "A1:B2:C3:D4:E5:F6", type: "unknown", isRogue: false },
  { id: "6", name: "Dev_MacBook", ip: "192.168.1.112", mac: "09:08:07:06:05:04", type: "laptop", isRogue: false },
];

export default function NetworkPage() {
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "done">("idle");
  const [progressText, setProgressText] = useState("");
  const [blockedDevices, setBlockedDevices] = useState<string[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [accessKey, setAccessKey] = useState("");
  const [keyType, setKeyType] = useState<KeyType>("ip");

  const handleScan = () => {
    if (!accessKey.trim()) return;
    
    setScanStatus("scanning");
    const steps = [
      `Authenticating with ${keyType === "ip" ? "subnet target" : keyType === "ssh" ? "SSH key" : "API token"}...`,
      "Initializing Nmap...",
      "Sweeping Subnet 192.168.1.0/24...",
      "Analyzing MAC Addresses...",
      "Verifying Signatures with Threat Intel...",
    ];
    let stepCount = 0;
    setProgressText(steps[0]);

    const interval = setInterval(() => {
      stepCount++;
      if (stepCount < steps.length) {
        setProgressText(steps[stepCount]);
      } else {
        clearInterval(interval);
        setScanStatus("done");
        setDevices(MOCK_DEVICES);
      }
    }, 1200); // Wait between steps for drama
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "laptop": return <Laptop className="w-8 h-8" />;
      case "desktop": return <Monitor className="w-8 h-8" />;
      case "mobile": return <Smartphone className="w-8 h-8" />;
      default: return <Wifi className="w-8 h-8" />;
    }
  };

  const blockDevice = (id: string) => {
    setBlockedDevices(prev => [...prev, id]);
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0a0f18] text-white">
      <Topbar title="Radar Réseau" subtitle="Analyse et balayage tactique" />

      <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full space-y-10 custom-scrollbar">
        <Link href="/detection" className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour au Radar
        </Link>
        
        <div className="flex flex-col items-center justify-center py-10">
          <h2 className="text-3xl font-bold font-mono tracking-widest uppercase mb-8 text-center text-gray-300">
            Network Operations Center
          </h2>

        {scanStatus === "idle" && (
          <div className="w-full max-w-lg space-y-6">
            <Card className="p-6 bg-[#0f172a] border-[#1e293b]">
              <div className="flex items-center gap-3 mb-4">
                <Key className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-200">Network Access Key</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">Provide credentials to authorize the network scan.</p>

              <div className="flex gap-2 mb-4">
                {([
                  { type: "ip" as KeyType, label: "IP Address", icon: Network },
                  { type: "ssh" as KeyType, label: "SSH Key", icon: Terminal },
                  { type: "token" as KeyType, label: "API Token", icon: Key },
                ]).map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setKeyType(type)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      keyType === type
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/50"
                        : "bg-[#1e293b] text-slate-500 border border-transparent hover:text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {keyType === "ssh" ? (
                <textarea
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50 text-sm font-mono text-slate-300 resize-none h-28 placeholder:text-slate-600"
                />
              ) : (
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder={keyType === "ip" ? "192.168.1.0/24 or 10.0.0.1" : "glpat-xxxxxxxxxxxxx"}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50 text-sm font-mono text-slate-300 placeholder:text-slate-600"
                />
              )}

              {accessKey && (
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Key provided — {keyType === "ip" ? "Subnet target" : keyType === "ssh" ? "SSH authentication" : "Token auth"}
                </div>
              )}
            </Card>

            <button
              onClick={handleScan}
              disabled={!accessKey.trim()}
              className="relative group p-1 rounded-full overflow-hidden w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 animate-spin-slow blur-xl opacity-70 group-hover:opacity-100 transition-opacity group-disabled:opacity-30"></div>
              <div className="relative bg-[#0f172a] hover:bg-slate-800 transition-colors border border-blue-500/50 rounded-full px-12 py-6 flex flex-col items-center gap-4 group-disabled:hover:bg-[#0f172a] group-disabled:border-slate-700">
                <Search className="w-12 h-12 text-blue-400 group-hover:scale-110 transition-transform group-disabled:group-hover:scale-100 group-disabled:text-slate-600" />
                <span className="text-2xl font-bold tracking-wider text-blue-100 group-disabled:text-slate-600">Sweep Network for Intruders</span>
              </div>
            </button>
          </div>
        )}

          {scanStatus === "scanning" && (
            <div className="flex flex-col items-center w-full max-w-lg space-y-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Radar sweep animation */}
                <div className="absolute inset-0 rounded-full border border-green-500/30"></div>
                <div className="absolute inset-0 rounded-full border border-green-500/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                <div className="w-full h-full rounded-full bg-green-500/10 conic-gradient-radar animate-spin-slow"></div>
                <Wifi className="w-10 h-10 text-green-500 absolute" />
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-1/2 animate-[progress_1s_ease-in-out_infinite_alternate]"></div>
              </div>
              <p className="font-mono text-green-400 text-lg animate-pulse">{progressText}</p>
            </div>
          )}
        </div>

        {scanStatus === "done" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-200">
                <Shield className="w-5 h-5 text-blue-500" />
                Connected Devices Map ({devices.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map(device => {
                const isBlocked = blockedDevices.includes(device.id);

                if (device.isRogue) {
                  return (
                    <Card key={device.id} className={`relative p-5 overflow-hidden flex flex-col justify-between ${
                      isBlocked ? "bg-slate-900 border-slate-700" : "bg-[#1f0f10] border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.2)] animate-pulse-border"
                    }`}>
                      {!isBlocked && (
                        <div className="absolute top-0 left-0 w-full p-1 bg-red-600 text-white text-xs font-bold text-center uppercase tracking-widest">
                          Rogue Device Detected
                        </div>
                      )}
                      <div className={`flex items-start gap-4 mb-4 ${!isBlocked ? "mt-4" : ""}`}>
                        <div className={`p-3 rounded-xl ${isBlocked ? "bg-slate-800 text-slate-500" : "bg-red-500/20 text-red-500"}`}>
                          {getDeviceIcon(device.type)}
                        </div>
                        <div>
                          <div className={`font-bold flex items-center gap-2 ${isBlocked ? "text-slate-400 line-through" : "text-white"}`}>
                            {!isBlocked && <AlertTriangle className="w-4 h-4 text-red-500" />}
                            {device.name}
                          </div>
                          <div className="text-sm font-mono text-slate-400 mt-1">IP: {device.ip}</div>
                          <div className="text-sm font-mono text-slate-400">MAC: {device.mac}</div>
                        </div>
                      </div>
                      
                      {!isBlocked ? (
                        <Button 
                          onClick={() => blockDevice(device.id)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                          Block Device (Containment API)
                        </Button>
                      ) : (
                        <Button disabled className="w-full bg-slate-800 text-slate-500 font-bold border border-slate-700">
                          <ShieldOff className="w-4 h-4 mr-2" /> Device Contained
                        </Button>
                      )}
                    </Card>
                  );
                }

                // Normal secure device
                return (
                  <Card key={device.id} className="p-5 bg-slate-900/50 border-slate-800 flex flex-col justify-between hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl relative">
                        {getDeviceIcon(device.type)}
                        <div className="absolute -bottom-1 -right-1 bg-[#0a0f18] rounded-full p-0.5">
                          <Shield className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{device.name}</div>
                        <div className="text-sm font-mono text-slate-400 mt-1">IP: {device.ip}</div>
                        <div className="text-sm font-mono text-slate-400">MAC: {device.mac}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .conic-gradient-radar {
          background: conic-gradient(from 0deg, transparent 0deg, rgba(34, 197, 94, 0.4) 300deg, rgba(34, 197, 94, 0.8) 360deg);
        }
        @keyframes ping-radar {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-pulse-border {
          animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(239, 68, 68, 0.2); }
          50% { border-color: rgba(239, 68, 68, 0.8); }
        }
      `}} />
    </div>
  );
}