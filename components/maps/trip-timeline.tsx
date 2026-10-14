"use client";

import React, { useState } from "react";
import { OrderStatus } from "@/types";
import { RouteStep } from "@/lib/routing";
import { formatDistance } from "@/lib/distance";
import { Bike, ChevronDown, Flag, MapPin, Navigation, CornerUpRight } from "lucide-react";

export interface TimelineStop {
  key: "rider" | "pickup" | "dropoff";
  label: string;
  address?: string;
  state: "done" | "current" | "upcoming";
  km?: number;
  min?: number;
}

interface TripTimelineProps {
  status: OrderStatus;
  stops: TimelineStop[];
  totalKm: number | null;
  totalMin: number | null;
  steps: RouteStep[];
  source: "google" | "osrm" | "straight" | null;
  loading: boolean;
}

function clockIn(min: number): string {
  return new Date(Date.now() + min * 60000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatMinutes(min: number): string {
  if (min < 60) return `${Math.max(1, Math.round(min))} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

const ICONS = { rider: Bike, pickup: MapPin, dropoff: Flag };
const DOT: Record<TimelineStop["key"], string> = {
  rider: "bg-purple-600",
  pickup: "bg-blue-600",
  dropoff: "bg-emerald-600",
};

/** Google-Maps-style trip summary: ETA header, stop-by-stop timeline and turn-by-turn steps. */
export function TripTimeline({ status, stops, totalKm, totalMin, steps, source, loading }: TripTimelineProps) {
  const [showSteps, setShowSteps] = useState(false);
  const finished = status === "delivered" || status === "cancelled";
  const planned = status === "pending";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* ETA header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-end justify-between gap-2">
        <div>
          {loading && totalMin === null ? (
            <div className="h-7 w-32 rounded-lg lp-skeleton" />
          ) : finished ? (
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {status === "delivered" ? "Delivered" : "Cancelled"}
            </p>
          ) : (
            <p className="text-xl font-black text-slate-900 dark:text-white">
              <span className={planned ? "" : "text-emerald-600 dark:text-emerald-400"}>
                {totalMin !== null ? formatMinutes(totalMin) : "--"}
              </span>
              <span className="ml-2 text-sm font-semibold text-slate-500">
                ({totalKm !== null ? formatDistance(totalKm) : "--"})
              </span>
            </p>
          )}
          <p className="text-[11px] text-slate-500 mt-0.5">
            {finished
              ? "Trip completed"
              : planned
              ? "Planned route from pickup to drop-off"
              : totalMin !== null
              ? `Arrives around ${clockIn(totalMin)}`
              : "Calculating route…"}
          </p>
        </div>
        {source && (
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {source === "straight" ? "Estimated (straight line)" : source === "google" ? "Google road route" : "OpenStreetMap road route"}
          </span>
        )}
      </div>

      {/* Stops */}
      <ol className="px-5 py-4">
        {stops.map((stop, idx) => {
          const Icon = ICONS[stop.key];
          const last = idx === stops.length - 1;
          const nextDone = stops[idx + 1]?.state === "done";
          return (
            <li key={stop.key} className="relative flex gap-3 pb-5 last:pb-0">
              {!last && (
                <span
                  className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${
                    stop.state === "done" && nextDone
                      ? "bg-[repeating-linear-gradient(to_bottom,#94a3b8_0_4px,transparent_4px_8px)]"
                      : "bg-blue-500/70"
                  }`}
                />
              )}
              <span
                className={`relative z-10 w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white shadow-md ${
                  stop.state === "done" ? "bg-slate-400 dark:bg-slate-600" : DOT[stop.key]
                } ${stop.state === "current" ? "ring-4 ring-purple-500/25" : ""}`}
              >
                <Icon className="w-4 h-4" />
                {stop.state === "current" && (
                  <span className="absolute inset-0 rounded-full bg-purple-500/40 animate-ping" />
                )}
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-bold ${
                      stop.state === "done" ? "text-slate-400 line-through decoration-1" : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {stop.label}
                  </p>
                  {stop.state !== "done" && stop.min !== undefined && !finished && (
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                      {planned ? formatMinutes(stop.min) : clockIn(stop.min)}
                    </span>
                  )}
                </div>
                {stop.address && <p className="text-[11px] text-slate-500 truncate">{stop.address}</p>}
                {stop.state !== "done" && stop.km !== undefined && !finished && (
                  <p className="text-[11px] text-slate-400">
                    {formatDistance(stop.km)} · {formatMinutes(stop.min || 0)}
                  </p>
                )}
                {stop.state === "done" && <p className="text-[11px] text-slate-400">Completed</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Turn-by-turn */}
      {steps.length > 0 && !finished && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowSteps(!showSteps)}
            aria-expanded={showSteps}
            className="w-full px-5 py-3 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
          >
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" /> Turn-by-turn directions ({steps.length} steps)
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showSteps ? "rotate-180" : ""}`} />
          </button>
          {showSteps && (
            <ol className="px-5 pb-4 space-y-2 max-h-64 overflow-y-auto animate-in fade-in duration-200">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs">
                  <CornerUpRight className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                  <span className="flex-1 text-slate-700 dark:text-slate-300">{step.instruction}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{formatDistance(step.distanceKm)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
