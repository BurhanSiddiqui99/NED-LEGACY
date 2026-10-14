"use client";

import React from "react";
import { Order } from "@/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";

/** Readable tooltip in both themes: solid card, dark/light text, coloured dot per series. */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg px-3 py-2 text-xs min-w-[140px]">
      {label && <p className="font-bold text-slate-900 dark:text-white mb-1">{label}</p>}
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.payload?.color || item.color || item.stroke }}
              />
              {item.name}
            </span>
            <span className="font-bold tabular-nums text-slate-900 dark:text-white">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AnalyticsChartsProps {
  orders: Order[];
}

export function AnalyticsCharts({ orders }: AnalyticsChartsProps) {
  // 1. Orders by Status data
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = [
    { name: "Pending", value: statusCounts.pending || 0, color: "#F59E0B" },
    { name: "Accepted", value: statusCounts.accepted || 0, color: "#12B76A" },
    { name: "Picked Up", value: statusCounts.picked_up || 0, color: "#84CC16" },
    { name: "In Transit", value: statusCounts.in_transit || 0, color: "#F97316" },
    {
      name: "At Warehouses",
      value: (statusCounts.at_origin_warehouse || 0) + (statusCounts.linehaul || 0) + (statusCounts.at_destination_warehouse || 0),
      color: "#14B8A6",
    },
    { name: "Out for Delivery", value: (statusCounts.last_mile_accepted || 0) + (statusCounts.out_for_delivery || 0), color: "#EAB308" },
    { name: "Delivered", value: statusCounts.delivered || 0, color: "#16A34A" },
    { name: "Cancelled", value: statusCounts.cancelled || 0, color: "#DC2626" },
  ].filter((item) => item.value > 0);

  // 2. Deliveries Volume over Past Days
  const last7Days: { date: string; fullDate: string; orders: number; delivered: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { weekday: "short" });
    const fullDate = d.toISOString().split("T")[0];

    const count = orders.filter((o) => {
      const createdStr = typeof o.createdAt === "object" && "seconds" in o.createdAt
        ? new Date((o.createdAt as any).seconds * 1000).toISOString()
        : String(o.createdAt);
      return createdStr.startsWith(fullDate);
    }).length;

    const deliveredCount = orders.filter((o) => {
      if (o.status !== "delivered") return false;
      const targetTime = o.deliveredAt || o.updatedAt;
      const delStr =
        targetTime && typeof targetTime === "object" && "seconds" in targetTime
          ? new Date((targetTime as any).seconds * 1000).toISOString()
          : String(targetTime || "");
      return delStr.startsWith(fullDate);
    }).length;

    last7Days.push({
      date: dateStr,
      fullDate,
      orders: count,
      delivered: deliveredCount,
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Order Volume Activity Trend */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="mb-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Daily Delivery Activity
          </h3>
          <p className="text-xs text-slate-500">
            Created orders vs completed deliveries over the last 7 days
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A09A" strokeOpacity={0.25} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A09A" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A09A" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#12B76A", strokeOpacity: 0.3, strokeWidth: 1 }} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
              <Area type="monotone" dataKey="orders" name="New Requests" stroke="#F97316" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={2} />
              <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#16A34A" fillOpacity={1} fill="url(#colorDelivered)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Status Breakdown Pie Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="mb-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Orders Breakdown by Lifecycle Status
          </h3>
          <p className="text-xs text-slate-500">
            Realtime distribution across pending, in transit, and completed orders
          </p>
        </div>

        <div className="h-64 w-full">
          {statusData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No orders registered yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  cornerRadius={6}
                  stroke="none"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#12B76A", strokeOpacity: 0.3, strokeWidth: 1 }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
