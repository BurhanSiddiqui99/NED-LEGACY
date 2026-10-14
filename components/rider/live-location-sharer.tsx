"use client";

import React, { useEffect, useRef, useState } from "react";
import { GeoLocation, Order } from "@/types";
import { ordersService } from "@/services/orders.service";
import { calculateDistance, formatDistance } from "@/lib/distance";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { Radio, Satellite, Route, Square, AlertCircle } from "lucide-react";

interface LiveLocationSharerProps {
  order: Order;
  riderUid: string;
}

type Mode = "off" | "gps" | "simulate";

// Throttling so a phone does not write to Firestore on every GPS tick
const MIN_WRITE_INTERVAL_MS = 4000;
const MIN_MOVE_KM = 0.015; // 15 m
const HEARTBEAT_MS = 20000;
const SIMULATION_TICK_MS = 3000;

const ACTIVE_STATUSES = ["accepted", "picked_up", "in_transit"];

/**
 * Streams the assigned rider's position onto the order document.
 * Customer and admin dashboards already listen to that document, so the rider pin
 * on their maps moves as soon as each write lands.
 */
export function LiveLocationSharer({ order, riderUid }: LiveLocationSharerProps) {
  const isActive = order.riderId === riderUid && ACTIVE_STATUSES.includes(order.status);

  const [mode, setMode] = useState<Mode>("off");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);

  const lastSentRef = useRef<{ at: number; loc: GeoLocation } | null>(null);
  const autoStartedRef = useRef(false);
  // Latest order kept in a ref so long-running timers always see the current status and position
  const orderRef = useRef(order);
  orderRef.current = order;

  const push = async (loc: GeoLocation, force = false) => {
    const now = Date.now();
    const last = lastSentRef.current;
    if (!force && last) {
      const elapsed = now - last.at;
      const moved = calculateDistance(last.loc.latitude, last.loc.longitude, loc.latitude, loc.longitude);
      if (elapsed < MIN_WRITE_INTERVAL_MS) return;
      if (moved < MIN_MOVE_KM && elapsed < HEARTBEAT_MS) return;
    }
    lastSentRef.current = { at: now, loc };
    try {
      await ordersService.updateLiveLocation(orderRef.current.id, riderUid, loc);
      setLastSentAt(now);
    } catch (err: any) {
      console.warn("Live location write failed:", err);
    }
  };

  // Start sharing real GPS automatically once the delivery is active
  useEffect(() => {
    if (isActive && !autoStartedRef.current) {
      autoStartedRef.current = true;
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        setMode("gps");
      }
    }
    if (!isActive) setMode("off");
  }, [isActive]);

  // Real device GPS
  useEffect(() => {
    if (mode !== "gps" || !isActive) return;
    if (!("geolocation" in navigator)) {
      setGpsError("This browser does not support GPS.");
      setMode("off");
      return;
    }

    setGpsError(null);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsError(null);
        push({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow location access or use Simulate Route."
            : "GPS signal unavailable. Try again outdoors or use Simulate Route.";
        setGpsError(msg);
        if (err.code === err.PERMISSION_DENIED) setMode("off");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isActive]);

  // Demo mode: drive the rider toward pickup (accepted) or drop-off (picked up / in transit)
  useEffect(() => {
    if (mode !== "simulate" || !isActive) return;

    const tick = () => {
      const o = orderRef.current;
      const target = o.status === "accepted" ? o.pickupLocation : o.deliveryLocation;
      const from = lastSentRef.current?.loc || o.currentRiderLocation || o.pickupLocation;

      const remainingKm = calculateDistance(from.latitude, from.longitude, target.latitude, target.longitude);
      if (remainingKm < 0.03) {
        push(target, true);
        return;
      }
      // Move ~15% of the remaining way per tick, but at least 150 m so short trips still animate
      const fraction = Math.min(1, Math.max(0.15, 0.15 / remainingKm));
      push(
        {
          latitude: from.latitude + (target.latitude - from.latitude) * fraction,
          longitude: from.longitude + (target.longitude - from.longitude) * fraction,
        },
        true
      );
    };

    tick();
    const id = setInterval(tick, SIMULATION_TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isActive]);

  if (!isActive) return null;

  const target = order.status === "accepted" ? order.pickupLocation : order.deliveryLocation;
  const current = order.currentRiderLocation;
  const remaining = current
    ? calculateDistance(current.latitude, current.longitude, target.latitude, target.longitude)
    : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              mode === "off" ? "bg-slate-400" : "bg-emerald-500 animate-ping"
            }`}
          />
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">
            {mode === "off"
              ? "Live location sharing is off"
              : mode === "gps"
              ? "Sharing live GPS with customer & admin"
              : "Simulating route (demo mode)"}
          </h2>
        </div>
        <span className="text-[11px] text-slate-500">
          {lastSentAt ? `Last update ${formatRelativeTime(new Date(lastSentAt).toISOString())}` : "No update sent yet"}
          {remaining !== null &&
            ` • ${formatDistance(remaining)} to ${order.status === "accepted" ? "pickup" : "drop-off"}`}
        </span>
      </div>

      {gpsError && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{gpsError}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            lastSentRef.current = null;
            setMode("gps");
            toast.success("Sharing your device GPS");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            mode === "gps"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <Satellite className="w-3.5 h-3.5" /> Device GPS
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("simulate");
            toast.info("Rider will move along the route every 3 seconds");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            mode === "simulate"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <Route className="w-3.5 h-3.5" /> Simulate Route
        </button>
        <button
          type="button"
          onClick={() => setMode("off")}
          disabled={mode === "off"}
          className="py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
        >
          <Square className="w-3.5 h-3.5" /> Stop
        </button>
      </div>

      <p className="text-[10px] text-slate-400 flex items-center gap-1">
        <Radio className="w-3 h-3" /> Updates are throttled to one write every 4 s (or 15 m of movement).
      </p>
    </div>
  );
}
