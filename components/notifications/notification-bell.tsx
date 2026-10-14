"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { notificationsService } from "@/services/notifications.service";
import { AppNotification } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { Bell, CheckCheck, ExternalLink, Package, MessageSquare, Truck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsub = notificationsService.subscribe(user.uid, (notifs) => {
      setNotifications(notifs);
    });

    return () => unsub();
  }, [user]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationsService.markAllAsRead(user.uid);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await notificationsService.markAsRead(notif.id);
    }
    setOpen(false);
    if (notif.orderId && user) {
      if (user.role === "customer") {
        router.push(`/customer/orders/${notif.orderId}`);
      } else if (user.role === "rider") {
        router.push(`/rider/deliveries/${notif.orderId}`);
      } else {
        router.push(`/admin/orders/${notif.orderId}`);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "order_created":
        return <Package className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.2]" />;
      case "order_accepted":
      case "status_updated":
        return <Truck className="w-4 h-4 text-teal-600 dark:text-teal-400 stroke-[2.2]" />;
      case "new_message":
        return <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400 stroke-[2.2]" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[2.2]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5 stroke-[2.2]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition ${
                    !notif.isRead ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/30">
            <Link
              href={
                user?.role === "customer"
                  ? "/customer/notifications"
                  : user?.role === "rider"
                  ? "/rider/notifications"
                  : "/admin/notifications"
              }
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1 py-1"
            >
              View all notifications <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
