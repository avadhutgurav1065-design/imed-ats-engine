"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications, Notification } from "@/lib/hooks/useNotifications";
import { cn } from "@/lib/utils";

const typeConfig = {
  drive: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: "🎯" },
  mentorship: { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "✅" },
  referral: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "💼" },
  system: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: "ℹ️" },
};

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open && unreadCount > 0) {
      setTimeout(markAllRead, 1000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-12 w-80 z-50 animate-in slide-in-from-top-2 duration-200">
            <div className="bg-[#0d1121]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <span className="text-sm font-bold text-white">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-slate-500 hover:text-cyan-400 transition-colors font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">No notifications yet</p>
                    <p className="text-[10px] text-slate-700 mt-1">
                      You'll see updates for drives, referrals & mentorship here
                    </p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const config = typeConfig[notif.type];
                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          "px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors",
                          !notif.read && "bg-white/[0.02]"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border text-sm", config.bg, config.border)}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-200 leading-relaxed">{notif.message}</p>
                            <p className="text-[10px] text-slate-600 mt-1">
                              {new Date(notif.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
