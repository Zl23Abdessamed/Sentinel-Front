"use client";

import { useState } from "react";
import { User, Bell, Shield, Key, Moon, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/nav/Topbar";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Globe },
  ];

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0a0f18]">
      <Topbar title="Paramètres" subtitle="Configuration de la plateforme" />
      
      <div className="p-6 max-w-5xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account settings and preferences.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#2563eb]/10 text-blue-500"
                      : "text-gray-400 hover:text-white hover:bg-[#1e293b]/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <Card className="p-6 bg-[#0f172a] border-[#1e293b]">
                  <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">First Name</label>
                        <input type="text" defaultValue="Admin" className="w-full bg-[#1e293b] border-none rounded-md px-4 py-2 text-white outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Last Name</label>
                        <input type="text" defaultValue="User" className="w-full bg-[#1e293b] border-none rounded-md px-4 py-2 text-white outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Email Address</label>
                      <input type="email" defaultValue="admin@sentinel.dz" className="w-full bg-[#1e293b] border-none rounded-md px-4 py-2 text-white outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <Card className="p-6 bg-[#0f172a] border-[#1e293b]">
                  <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Current Password</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-[#1e293b] border-none rounded-md px-4 py-2 text-white outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">New Password</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-[#1e293b] border-none rounded-md px-4 py-2 text-white outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Confirm New Password</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-[#1e293b] border-none rounded-md px-4 py-2 text-white outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">Update Password</Button>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <Card className="p-6 bg-[#0f172a] border-[#1e293b]">
                  <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    {[
                      "Email notifications for high severity incidents",
                      "Push notifications for new reports",
                      "Weekly digest emails",
                      "Compliance alert notifications"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-[#1e293b] last:border-0">
                        <span className="text-sm text-gray-300">{item}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked={i < 2} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-6">
                <Card className="p-6 bg-[#0f172a] border-[#1e293b]">
                  <h3 className="text-lg font-semibold text-white mb-4">App Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Moon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-300">Dark Mode</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
