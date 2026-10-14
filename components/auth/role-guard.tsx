"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/types";
import { Loader2, ShieldAlert } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (role && !allowedRoles.includes(role)) {
        router.replace("/unauthorized");
      }
    }
  }, [user, role, loading, allowedRoles, router]);

  // Signed out (or session expired): quietly hand over to the login page
  if (!loading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-7 h-7 animate-spin text-[#12B76A]" />
        <span className="text-xs text-slate-500">Redirecting to sign in…</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-sm text-center">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#027A48] via-[#039855] to-[#12B76A] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-blue-500/20 blur-md -z-10" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">LogiPulse Security</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verifying encrypted role credentials & session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg border border-red-200 dark:border-red-900/50 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            You do not have permission to view this dashboard. Your current role is <strong>{role || "Unassigned"}</strong>.
          </p>
          <button
            onClick={() => router.push(`/dashboard`)}
            className="mt-6 px-4 py-2 bg-[#039855] hover:bg-[#027A48] text-white rounded-lg text-sm font-medium transition"
          >
            Go to Your Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
