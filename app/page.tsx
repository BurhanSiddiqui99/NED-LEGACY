"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { DEMO_ACCOUNTS } from "@/constants";
import {
  Radio,
  Package,
  Bike,
  ShieldCheck,
  Navigation,
  ArrowRight,
  Sparkles,
  Zap,
  MapPin,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, role, switchDemoRole } = useAuth();

  const handleLaunchRole = async (targetRole: "customer" | "rider" | "admin") => {
    await switchDemoRole(targetRole);
    router.push(`/${targetRole}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#142B49] via-[#2563EB] to-[#0D9488] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-blue-700 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
                LogiPulse
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                Karachi Delivery Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link
                href={`/${role || "dashboard"}`}
                className="px-4 py-2 bg-[#142B49] hover:bg-[#0f2138] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-900/20"
              >
                <span>Open {role?.toUpperCase()} Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
                >
                  Register Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col items-center justify-center text-center">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/60 dark:to-teal-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>NED University Hackathon • Production-Quality Logistics Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight max-w-4xl leading-tight">
          Intelligent Last-Mile Courier & Delivery Management
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          LogiPulse synchronizes senders, motorcycle delivery partners, and central logistics operations with real-time Haversine distance ranking and live Firestore event streaming across Karachi.
        </p>

        {/* 1-Click Role Launchers for Evaluation */}
        <div className="mt-10 w-full max-w-4xl p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-left">
              <Zap className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Instant Role Demonstration
                </h3>
                <p className="text-[11px] text-slate-400">
                  Switch instantly into any of the 3 interconnected dashboards:
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
              Zero Config Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Customer Box */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-left flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-md shadow-blue-500/20">
                  <Package className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Customer Portal
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Book courier requests from Saddar to Clifton, track status, and chat with assigned riders.
                </p>
              </div>
              <button
                onClick={() => handleLaunchRole("customer")}
                className="mt-4 w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Launch Customer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rider Box */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-left flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3 shadow-md shadow-amber-500/20">
                  <Bike className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Rider Partner Portal
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Browse nearby orders sorted by live GPS distance, accept jobs atomically, and progress milestones.
                </p>
              </div>
              <button
                onClick={() => handleLaunchRole("rider")}
                className="mt-4 w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Launch Rider</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Admin Box */}
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-left flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#142B49] text-white flex items-center justify-center mb-3 shadow-md shadow-purple-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Admin Control Center
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Real-time fleet monitoring, Recharts analytics, user verification, and full operations control.
                </p>
              </div>
              <button
                onClick={() => handleLaunchRole("admin")}
                className="mt-4 w-full py-2 px-3 bg-[#142B49] hover:bg-[#0f2138] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Launch Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Core Architecture highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl text-left">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Navigation className="w-5 h-5 text-teal-600 mb-2" />
            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
              Smart Nearby Pickup
            </h5>
            <p className="text-[11px] text-slate-500 mt-1">
              Haversine dynamic distance ranking from rider to pickup.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Radio className="w-5 h-5 text-blue-600 mb-2" />
            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
              Realtime Synced
            </h5>
            <p className="text-[11px] text-slate-500 mt-1">
              Firestore onSnapshot listeners push status immediately.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Lock className="w-5 h-5 text-purple-600 mb-2" />
            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
              Atomic Transactions
            </h5>
            <p className="text-[11px] text-slate-500 mt-1">
              Guarantees only one rider can accept an order.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <MapPin className="w-5 h-5 text-amber-600 mb-2" />
            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
              Karachi Landmarks
            </h5>
            <p className="text-[11px] text-slate-500 mt-1">
              Real verified geographic coordinates across Karachi.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>LogiPulse © 2026. Built with Next.js App Router, TypeScript, Tailwind CSS & Firebase Cloud Firestore.</p>
      </footer>
    </div>
  );
}
