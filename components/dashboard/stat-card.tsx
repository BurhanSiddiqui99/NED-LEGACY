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
    blue: "from-blue-600 to-indigo-600 text-blue-600 bg-blue-50 dark:bg-blue-950/60",
    teal: "from-teal-600 to-emerald-600 text-teal-600 bg-teal-50 dark:bg-teal-950/60",
    amber: "from-amber-500 to-orange-500 text-amber-600 bg-amber-50 dark:bg-amber-950/60",
    purple: "from-purple-600 to-pink-600 text-purple-600 bg-purple-50 dark:bg-purple-950/60",
    emerald: "from-emerald-600 to-teal-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {value}
          </div>
        </div>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorMap[colorScheme]}`}
        >
          <Icon className="w-6 h-6 text-white" />
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
