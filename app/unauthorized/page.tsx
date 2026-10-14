"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ShieldAlert, ArrowLeft, LayoutDashboard } from "lucide-react";

export default function UnauthorizedPage() {
  const { user, role } = useAuth();

  return (
    <div className="min-h-screen bg-[#F5F8F6] dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          Access Restricted / Unauthorized
        </h1>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          You tried to access a section restricted to a different role. Your currently authenticated role is{" "}
          <strong className="text-slate-800 dark:text-slate-200 uppercase">{role || "Unauthenticated"}</strong>.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href={role ? `/${role}/dashboard` : "/login"}
            className="py-2.5 px-4 bg-[#039855] hover:bg-[#027A48] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to My Dashboard</span>
          </Link>

          <Link
            href="/"
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
