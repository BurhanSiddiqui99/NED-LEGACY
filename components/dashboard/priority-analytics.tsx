"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Order, OrderPriority } from "@/types";
import { PRIORITY_CONFIG, PRIORITY_LEVELS, getOrderPriority } from "@/constants";
import { AlertTriangle, Flame, Minus } from "lucide-react";

interface PriorityAnalyticsProps {
  orders: Order[];
}

const ACCENTS: Record<OrderPriority, { icon: React.ElementType; tile: string; number: string; bar: string }> = {
  normal: {
    icon: Minus,
    tile: "border-slate-200 dark:border-slate-800",
    number: "text-slate-900 dark:text-white",
    bar: "bg-slate-400",
  },
  high: {
    icon: AlertTriangle,
    tile: "border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20",
    number: "text-orange-700 dark:text-orange-300",
    bar: "bg-orange-500",
  },
  urgent: {
    icon: Flame,
    tile: "border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20",
    number: "text-red-700 dark:text-red-300",
    bar: "bg-red-500",
  },
};

/**
 * Live priority counters. Recomputed from the same realtime orders snapshot the rest of the
 * admin dashboard uses, so a new URGENT request shows up here the moment it is created.
 */
export function PriorityAnalytics({ orders }: PriorityAnalyticsProps) {
  const stats = useMemo(() => {
    const base = () => ({ total: 0, waiting: 0, active: 0 });
    const result: Record<OrderPriority, { total: number; waiting: number; active: number }> = {
      normal: base(),
      high: base(),
      urgent: base(),
    };
    orders.forEach((o) => {
      if (o.status === "cancelled") return;
      const p = getOrderPriority(o);
      result[p].total++;
      if (o.status === "pending") result[p].waiting++;
      if (o.status === "accepted" || o.status === "picked_up" || o.status === "in_transit") result[p].active++;
    });
    return result;
  }, [orders]);

  const grandTotal = PRIORITY_LEVELS.reduce((sum, p) => sum + stats[p].total, 0) || 1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" /> Peak Hours: Priority Analytics
          </h2>
          <p className="text-xs text-slate-500">Live order counts by priority (cancelled orders excluded).</p>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Filter orders by priority →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PRIORITY_LEVELS.map((p) => {
          const accent = ACCENTS[p];
          const Icon = accent.icon;
          return (
            <div key={p} className={`rounded-2xl border p-4 space-y-2 ${accent.tile}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" /> {PRIORITY_CONFIG[p].label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {Math.round((stats[p].total / grandTotal) * 100)}%
                </span>
              </div>
              <p className={`text-3xl font-black tabular-nums ${accent.number}`}>{stats[p].total}</p>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${accent.bar}`}
                  style={{ width: `${(stats[p].total / grandTotal) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  <strong className="text-slate-800 dark:text-slate-200">{stats[p].waiting}</strong> awaiting rider
                </span>
                <span>
                  <strong className="text-slate-800 dark:text-slate-200">{stats[p].active}</strong> in progress
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
