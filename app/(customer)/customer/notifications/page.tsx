"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { notificationsService } from "@/services/notifications.service";
import { AppNotification } from "@/types";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  Package,
  Truck,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerNotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = notificationsService.subscribe(user.uid, user.role, (data) => {
      setNotifications(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationsService.markAllAsRead(user.uid, user.role);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await notificationsService.markAsRead(notif.id);
    }
    if (notif.orderId) {
      router.push(`/customer/orders/${notif.orderId}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "order_created":
        return <Package className="w-4 h-4 text-blue-500" />;
      case "order_accepted":
      case "status_updated":
        return <Truck className="w-4 h-4 text-teal-500" />;
      case "new_message":
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime alerts on delivery requests, status updates, and courier messages.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              No notifications yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              When a rider accepts your delivery or updates milestones, alerts will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition ${
                !notif.isRead ? "bg-blue-50/30 dark:bg-blue-950/20" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {notif.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {notif.message}
                </p>

                {notif.orderId && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-2">
                    <span>View Order #{notif.orderId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>

              {!notif.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
