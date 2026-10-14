"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ridersService } from "@/services/riders.service";
import { WAREHOUSES, getWarehouse } from "@/lib/logistics";
import { toast } from "sonner";
import { Building2, Loader2, AlertTriangle } from "lucide-react";

/**
 * Shows which city the rider works in (jobs are filtered by it) and lets them set or change it.
 * Riders registered before cities existed see a prompt until they pick one.
 */
export function RiderCityCard() {
  const { user, riderProfile, riderWarehouseId } = useAuth();
  const [saving, setSaving] = useState(false);
  const current = getWarehouse(riderWarehouseId);
  const explicit = Boolean(riderProfile?.warehouseId);

  const save = async (warehouseId: string) => {
    const wh = getWarehouse(warehouseId);
    if (!user || !wh) return;
    setSaving(true);
    try {
      await ridersService.setCity(user.uid, wh.id, wh.city);
      toast.success(`You now receive jobs in ${wh.city}.`);
    } catch (err: any) {
      toast.error(err.message || "Could not update your city");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        explicit
          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 flex items-center justify-center shrink-0">
          {explicit ? <Building2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Your delivery city</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {current ? `${current.city} (${current.province})` : "Not set"}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {explicit
              ? `You only see jobs that start in ${current?.city}: customer pickups and parcels at the ${current?.name}.`
              : "Not confirmed yet: we guessed it from your location. Choose your city so you get the right jobs."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <label htmlFor="rider-city-select" className="sr-only">
          Delivery city
        </label>
        <select
          id="rider-city-select"
          value={explicit ? riderProfile?.warehouseId : ""}
          onChange={(e) => save(e.target.value)}
          disabled={saving}
          className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="" disabled>
            Choose city…
          </option>
          {WAREHOUSES.map((w) => (
            <option key={w.id} value={w.id}>
              {w.city}
            </option>
          ))}
        </select>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
      </div>
    </div>
  );
}
