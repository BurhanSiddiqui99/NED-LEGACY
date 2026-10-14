"use client";

import React, { useEffect, useState } from "react";
import { notificationsService } from "@/services/notifications.service";
import { useAuth } from "@/contexts/auth-context";
import { AppNotification } from "@/types";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { Bell, Radio, CheckCheck, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const [audience, setAudience] = useState<"all" | "riders">("all");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = notificationsService.subscribe(user.uid, "admin", (data) => {
      setNotifications(data);
    });
    return () => unsub();
  }, [user]);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    setBroadcasting(true);
    try {
      await notificationsService.create({
        userId: audience,
        title: `[ALERT] ${broadcastTitle}`,
        message: broadcastMessage,
        type: "system",
      });
      toast.success(audience === "all" ? "Alert sent to every user." : "Alert sent to all riders.");
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch alert");
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          System Alerts & Notification Dispatch
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time delivery lifecycle logs and central fleet broadcast controls.
        </p>
      </div>

      {/* Broadcast Form */}
      <form
        onSubmit={handleSendBroadcast}
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-purple-600" />
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">
            Dispatch Platform System Alert
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Send To
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as "all" | "riders")}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">Everyone (customers, riders, admins)</option>
              <option value="riders">All riders</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alert Subject
            </label>
            <input
              type="text"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="e.g. Heavy Rain Alert Saddar Area"
              required
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description
            </label>
            <input
              type="text"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="e.g. Couriers please exercise caution near Shahrah-e-Faisal"
              required
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={broadcasting}
          className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          <span>Send Broadcast Alert</span>
        </button>
      </form>

      {/* Log Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-700 dark:text-slate-300">
          Recent Operations Notifications ({notifications.length})
        </div>

        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-xs">No admin notifications recorded.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className="p-4 sm:p-5 flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {notif.title}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {notif.message}
                </p>
                {notif.orderId && (
                  <Link
                    href={`/admin/orders/${notif.orderId}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1.5 hover:underline"
                  >
                    <span>View Order #{notif.orderId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
