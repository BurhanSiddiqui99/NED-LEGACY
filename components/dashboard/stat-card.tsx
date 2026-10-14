"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  colorScheme?: "blue" | "teal" | "amber" | "purple" | "emerald";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = "blue",
}: StatCardProps) {
  const colorMap = {
    blue: { tile: "from-green-500 to-emerald-700 shadow-blue-500/30", glow: "bg-blue-500" },
    teal: { tile: "from-orange-400 to-orange-600 shadow-pink-500/30", glow: "bg-pink-500" },
    amber: { tile: "from-amber-400 to-orange-500 shadow-amber-500/30", glow: "bg-amber-500" },
    purple: { tile: "from-indigo-400 to-indigo-600 shadow-indigo-500/30", glow: "bg-indigo-500" },
    emerald: { tile: "from-emerald-400 to-green-600 shadow-emerald-500/30", glow: "bg-emerald-500" },
  };

  return (
    <div className="lp-lift group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-lg">
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${colorMap[colorScheme].glow}`}
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {value}
          </div>
        </div>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white bg-gradient-to-br shadow-lg ${colorMap[colorScheme].tile}`}
        >
          <Icon className="w-6 h-6 stroke-[2.2]" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.positive ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
