"use client";

import { RiderCityCard } from "@/components/rider/rider-city-card";
import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { formatDateTime } from "@/lib/utils";
import {
  Bike,
  User,
  Phone,
  Mail,
  Car,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Power,
  Award,
} from "lucide-react";

export default function RiderProfilePage() {
  const { user, riderProfile, updateRiderAvailability } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Rider Partner Fleet Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verified delivery partner identity and vehicle registration.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#027A48] via-[#039855] to-[#12B76A] text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/20">
              <Bike className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {user?.fullName}
                </h2>
                {riderProfile?.isVerified && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Rider
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => updateRiderAvailability(!riderProfile?.isAvailable)}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
              riderProfile?.isAvailable
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-white"
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{riderProfile?.isAvailable ? "Available (Online)" : "Off-Duty"}</span>
          </button>
        </div>

        <RiderCityCard />

        {/* Stats and Vehicle Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
              <Car className="w-3.5 h-3.5 text-blue-500" /> Registered Vehicle
            </span>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {riderProfile?.vehicleType || "Honda Motorcycle"}
            </p>
            <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
              Plate: {riderProfile?.vehicleNumber || "KHI-KAS-4821"}
            </span>

          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Completed Jobs
            </span>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {riderProfile?.completedDeliveries || 42} Deliveries
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
              ⭐ 4.9 / 5.0 Courier Rating
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-teal-500" /> Registered Phone
            </span>
            <p className="font-semibold text-slate-900 dark:text-white text-sm font-mono">
              {user?.phone || "+92 321 7654321"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-purple-500" /> Fleet Onboard Date
            </span>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {formatDateTime(riderProfile?.createdAt || user?.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
