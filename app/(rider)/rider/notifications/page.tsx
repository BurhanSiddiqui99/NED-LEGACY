"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { notificationsService } from "@/services/notifications.service";
import { AppNotification } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  Package,
  Truck,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function RiderNotificationsPage() {
  const { user, riderWarehouseId } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = notificationsService.subscribe(
      user.uid,
      user.role,
      (data) => {
        setNotifications(data);
        setLoading(false);
      },
      riderWarehouseId
    );
    return () => unsub();
  }, [user, riderWarehouseId]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationsService.markAllAsRead(user.uid, user.role, riderWarehouseId);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await notificationsService.markAsRead(notif.id);
    }
    if (notif.type === "order_created") {
      router.push("/rider/available-orders");
    } else if (notif.orderId) {
      router.push(`/rider/deliveries/${notif.orderId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Rider Alert Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime notifications on order assignments, nearby requests, and customer messages.
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
              New deliveries and sender messages will notify you here immediately.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition ${
                !notif.isRead ? "bg-amber-50/30 dark:bg-amber-950/20" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                {notif.type === "new_message" ? (
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                ) : (
                  <Package className="w-4 h-4 text-amber-600" />
                )}
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
                    <span>Open Delivery #{notif.orderId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>

              {!notif.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
