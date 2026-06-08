"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, MessageSquare, FileText, Users, Edit2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: "page_updated" | "comment_added" | "space_invite" | "page_created";
  message: string;
  read: boolean;
  created_at: string;
  page_id: string | null;
  space_id: string | null;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  page_updated: <Edit2 className="h-3.5 w-3.5" />,
  comment_added: <MessageSquare className="h-3.5 w-3.5" />,
  space_invite: <Users className="h-3.5 w-3.5" />,
  page_created: <FileText className="h-3.5 w-3.5" />,
};

const TYPE_COLOR: Record<string, string> = {
  page_updated: "bg-[#DEEBFF] text-[#0052CC]",
  comment_added: "bg-[#E3FCEF] text-[#00875A]",
  space_invite: "bg-[#EAE6FF] text-[#6554C0]",
  page_created: "bg-[#FFFAE6] text-[#FF8B00]",
};

export default function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadNotifications() {
    const resp = await fetch("/api/notifications");
    if (!resp.ok) return;
    const data = await resp.json();
    setNotifications(data.notifications || []);
    setUnreadCount(data.unread_count || 0);
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  function handleNotificationClick(n: Notification) {
    markRead(n.id);
    if (n.page_id && n.space_id) {
      router.push(`/spaces/${n.space_id}/pages/${n.page_id}/edit`);
    } else if (n.space_id) {
      router.push(`/spaces/${n.space_id}`);
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) loadNotifications();
        }}
        className="h-8 w-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-96 bg-white dark:bg-slate-800 border border-[#DFE1E6] dark:border-slate-700 rounded-lg shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#DFE1E6] dark:border-slate-700">
            <h3 className="font-semibold text-[#172B4D] dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-[#0052CC] hover:underline"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-[#C1C7D0] dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-[#6B778C] dark:text-slate-400">No notifications yet</p>
                <p className="text-xs text-[#97A0AF] dark:text-slate-500 mt-1">
                  You&apos;ll be notified about page updates and comments
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors border-b border-[#F4F5F7] dark:border-slate-700/50 last:border-0 ${
                    !n.read ? "bg-[#DEEBFF]/20 dark:bg-blue-900/10" : ""
                  }`}
                >
                  <div
                    className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                      TYPE_COLOR[n.type] || "bg-[#F4F5F7] text-[#6B778C]"
                    }`}
                  >
                    {TYPE_ICON[n.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        !n.read
                          ? "font-medium text-[#172B4D] dark:text-slate-200"
                          : "text-[#42526E] dark:text-slate-400"
                      }`}
                    >
                      {n.message}
                    </p>
                    <p className="text-xs text-[#97A0AF] dark:text-slate-500 mt-0.5">
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="mt-2 h-2 w-2 rounded-full bg-[#0052CC] shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[#DFE1E6] dark:border-slate-700">
            <button className="text-sm text-[#0052CC] hover:underline">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
