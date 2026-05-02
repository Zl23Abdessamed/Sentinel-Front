"use client";

import { Bell, AlertTriangle, Info, CheckCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Topbar } from "@/components/nav/Topbar";

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: "alert",
      title: "High Severity Incident Detected",
      description: "A new incident report matches critical keywords 'self-harm' in Blida region.",
      time: "10 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "info",
      title: "System Update Complete",
      description: "The Sentinel-DZ AI processing engine has been updated to version 2.4.",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 3,
      type: "success",
      title: "Weekly Report Generated",
      description: "Your team's weekly performance and incident summary is ready for review.",
      time: "1 day ago",
      read: true,
    },
    {
      id: 4,
      type: "alert",
      title: "New Black Box Entry",
      description: "Immutable record #4992 accessed by external regulator for review.",
      time: "2 days ago",
      read: true,
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "alert": return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "info": return <Info className="w-5 h-5 text-blue-500" />;
      case "success": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0a0f18]">
      <Topbar title="Notifications" subtitle="Alertes et statut du système" />
      
      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Notifications</h1>
            <p className="text-gray-400">Stay updated on alerts, system status, and incident reports.</p>
          </div>
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Mark all as read
          </button>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`p-4 transition-colors ${
                notification.read 
                  ? "bg-[#0f172a] border-[#1e293b]" 
                  : "bg-[#1e293b]/50 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
              }`}
            >
              <div className="flex gap-4">
                <div className={`p-2 rounded-full h-fit ${notification.read ? "bg-[#1e293b]" : "bg-blue-500/10"}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className={`font-semibold ${notification.read ? "text-gray-300" : "text-white"}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {notification.time}
                    </div>
                  </div>
                  <p className={`text-sm mt-1 ${notification.read ? "text-gray-500" : "text-gray-400"}`}>
                    {notification.description}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
