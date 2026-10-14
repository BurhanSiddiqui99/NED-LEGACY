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
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40",
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900/40",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/40",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40",
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
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${colorMap[colorScheme]}`}
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
