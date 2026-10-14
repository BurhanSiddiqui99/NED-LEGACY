"use client";

import React, { useEffect, useState } from "react";
import { ridersService } from "@/services/riders.service";
import { Rider } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Bike, ShieldCheck, ShieldAlert, Search, Power, CheckCircle, Award } from "lucide-react";
import { toast } from "sonner";
import { WAREHOUSES, getWarehouse } from "@/lib/logistics";

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsub = ridersService.subscribeRiders((data) => {
      setRiders(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredRiders = riders.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      (r.fullName && r.fullName.toLowerCase().includes(term)) ||
      (r.email && r.email.toLowerCase().includes(term)) ||
      r.vehicleType.toLowerCase().includes(term) ||
      r.vehicleNumber.toLowerCase().includes(term)
    );
  });

  const handleCityChange = async (rider: Rider, warehouseId: string) => {
    const wh = getWarehouse(warehouseId);
    if (!wh) return;
    try {
      await ridersService.setCity(rider.uid, wh.id, wh.city);
      toast.success(`${rider.fullName || "Rider"} now delivers in ${wh.city}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update city");
    }
  };

  const handleToggleVerification = async (rider: Rider) => {
    try {
      await ridersService.toggleVerification(rider.uid, rider.isVerified);
      toast.success(
        `Rider ${rider.fullName || rider.vehicleNumber} verification status updated to ${
          !rider.isVerified ? "VERIFIED" : "UNVERIFIED"
        }`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update verification");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Delivery Rider Fleet Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor registered couriers, vehicle compliance plates, completed jobs, and verification badges.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search rider, vehicle, plate..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Courier Partner</th>
                <th className="py-3.5 px-4">City</th>
                <th className="py-3.5 px-4">Vehicle Specs</th>
                <th className="py-3.5 px-4">Registration Plate</th>
                <th className="py-3.5 px-4">Live Availability</th>
                <th className="py-3.5 px-4">Completed Jobs</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredRiders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Bike className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    No riders found matching query.
                  </td>
                </tr>
              ) : (
                filteredRiders.map((rider) => (
                  <tr key={rider.uid} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <span>{rider.fullName || "Tariq Mahmood"}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {rider.email || "rider@logipulse.demo"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={rider.warehouseId || ""}
                        onChange={(e) => handleCityChange(rider, e.target.value)}
                        aria-label={`City for ${rider.fullName || "rider"}`}
                        className="text-xs px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="" disabled>
                          Not set
                        </option>
                        {WAREHOUSES.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.city}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {rider.vehicleType}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {rider.vehicleNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          rider.isAvailable
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            rider.isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          }`}
                        />
                        {rider.isAvailable ? "Available" : "Off-Duty"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>{rider.completedDeliveries || 0}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          rider.isVerified
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {rider.isVerified ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Verified
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Unverified
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleVerification(rider)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                          rider.isVerified
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        }`}
                      >
                        {rider.isVerified ? "Revoke Verification" : "Verify Rider"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
