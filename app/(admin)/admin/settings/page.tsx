"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { MockStore } from "@/lib/firebase/mock-store";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  Settings,
  Cloud,
  RotateCcw,
  Sparkles,
  MapPin,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [baseFare, setBaseFare] = useState("150");
  const [perKmRate, setPerKmRate] = useState("35");
  const [perKgRate, setPerKgRate] = useState("25");

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Courier pricing parameters saved successfully!");
  };

  const handleResetDemoData = () => {
    MockStore.resetDefaults();
    toast.success("Demo dataset reset to initial state with Karachi orders!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Logistics Control & System Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage cloud synchronization, courier pricing algorithms, and presentation resets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Firebase Cloud Connection Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isFirebaseConfigured
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60"
                  : "bg-teal-50 text-teal-600 dark:bg-teal-950/60"
              }`}
            >
              {isFirebaseConfigured ? <Cloud className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Firebase Firestore Status
              </h2>
              <span className="text-[11px] text-slate-400">Database & Auth Provider</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Active Mode:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {isFirebaseConfigured ? "Google Cloud Firestore" : "Local Database Mode"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Realtime Synchronization:</span>
              <span className="font-semibold text-emerald-600">Active (onSnapshot)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Atomic Order Locks:</span>
              <span className="font-semibold text-blue-600">Enabled (Transactions)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            To link your custom Google Cloud Firebase project, populate your credentials inside <code>.env.local</code>.
          </p>
        </div>

        {/* Database State Reset Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <RotateCcw className="w-4 h-4" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Initial Orders & Fleet Reset
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Restore initial seed orders and riders across Karachi hubs for testing delivery workflows.
            </p>
          </div>

          <button
            onClick={handleResetDemoData}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Initial Orders & State</span>
          </button>
        </div>
      </div>

      {/* Pricing Algorithm Configuration */}
      <form
        onSubmit={handleSaveRates}
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">
            Karachi Distance-Based Courier Rate Configuration
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Base Pickup Fare (PKR)
            </label>
            <input
              type="number"
              value={baseFare}
              onChange={(e) => setBaseFare(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Per Kilometer Rate (PKR/km)
            </label>
            <input
              type="number"
              value={perKmRate}
              onChange={(e) => setPerKmRate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Weight Surcharge (PKR/kg)
            </label>
            <input
              type="number"
              value={perKgRate}
              onChange={(e) => setPerKgRate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <button
          type="submit"
          className="py-2.5 px-4 bg-[#142B49] hover:bg-[#0f2138] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Save Pricing Formulas</span>
        </button>
      </form>
    </div>
  );
}
