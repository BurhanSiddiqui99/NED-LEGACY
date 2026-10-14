"use client";

import React from "react";
import { MockStore } from "@/lib/firebase/mock-store";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const handleResetDemoData = () => {
    MockStore.resetDefaults();
    toast.success("Demo dataset reset to its initial state!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">System Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Presentation and demo data controls.</p>
      </div>

      {/* Database State Reset Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <RotateCcw className="w-4 h-4" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Initial Orders & Fleet Reset</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Restore the initial seed orders (all priorities) and riders for testing delivery workflows.
          </p>
        </div>

        <button
          onClick={handleResetDemoData}
          className="w-full sm:w-auto py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Initial Orders & State</span>
        </button>
      </div>
    </div>
  );
}
