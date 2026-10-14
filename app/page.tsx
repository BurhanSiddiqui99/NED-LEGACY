"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Radio,
  Package,
  Bike,
  ShieldCheck,
  Navigation,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  Lock,
  LogOut,
  User,
  PackagePlus,
  Compass,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, role, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#142B49] via-[#2563EB] to-[#0D9488] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-blue-700 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
                LogiPulse
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                Pakistan Delivery Network
              </span>
            </div>
          </Link>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span className="truncate max-w-[130px]">{user.fullName}</span>
                  <span className="capitalize text-[10px] text-slate-400">({user.role})</span>
                </span>

                <Link
                  href={`/${role || "dashboard"}`}
                  className="px-4 py-2 bg-[#142B49] hover:bg-[#0f2138] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-900/20 whitespace-nowrap"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 flex items-center gap-1"
                >
                  <span>Register Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col items-center justify-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/60 dark:to-teal-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Full-Stack Last-Mile Courier Platform • Pakistan Delivery Network</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight max-w-4xl leading-tight">
          Intelligent Last-Mile Courier & Delivery Management
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          LogiPulse powers real-time deliveries across Pakistan. Senders dispatch parcels with live Haversine distance pricing, motorcycle riders claim nearby assignments atomically, and administrators monitor live operations.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={user ? `/${role}/dashboard` : "/login"}
            className="px-6 py-3 bg-[#142B49] hover:bg-[#0f2138] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-950/20 transition flex items-center gap-2"
          >
            <span>{user ? "Open Your Dashboard" : "Sign In to Portal"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/register"
            className="px-6 py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
          >
            <span>Register Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/customer/create-order"
            className="px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center gap-2"
          >
            <PackagePlus className="w-4 h-4 text-teal-600" />
            <span>Send a Courier Parcel</span>
          </Link>
        </div>

        {/* 3 Role Portals Cards */}
        <div className="mt-14 w-full max-w-5xl">
          <div className="text-left mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Role-Based Portals & Dashboards
            </h3>
            <p className="text-xs text-slate-500">
              Access the dedicated dashboard tailored to your role:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {/* Customer Box */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-4 shadow-sm">
                  <Package className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Customer Portal
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Book courier delivery requests anywhere in Pakistan with real coordinates, track live milestone timelines, and chat directly with your assigned rider.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href="/customer/dashboard"
                  className="w-full py-2.5 px-4 bg-[#142B49] hover:bg-[#0f2138] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Customer Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/customer/create-order"
                  className="w-full py-2 px-3 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline block"
                >
                  + Create New Courier Request
                </Link>
              </div>
            </div>

            {/* Rider Box */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center mb-4 shadow-sm">
                  <Bike className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Rider Partner Fleet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Smart Nearby Pickup Feed dynamically ranks pending orders by Haversine GPS distance. Accept jobs atomically and progress milestones to drop-off.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href="/rider/dashboard"
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Rider Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/rider/available-orders"
                  className="w-full py-2 px-3 text-center text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline block"
                >
                  View Nearby Available Orders
                </Link>
              </div>
            </div>

            {/* Admin Box */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center mb-4 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Admin Operations Center
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Realtime fleet monitoring, Recharts delivery analytics, customer and courier verification, complete order manifests, and system alerts.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href="/admin/dashboard"
                  className="w-full py-2.5 px-4 bg-[#142B49] hover:bg-[#0f2138] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Admin Operations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/admin/orders"
                  className="w-full py-2 px-3 text-center text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline block"
                >
                  Manage All Orders & Manifests
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl text-left">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <Navigation className="w-5 h-5 text-teal-600 mb-2" />
            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
              Smart Nearby Pickup
            </h5>
            <p className="text-[11px] text-slate-500 mt-1">
              Haversine formula dynamically sorts orders by proximity in kilometers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <Radio className="w-5 h-5 text-blue-600 mb-2" />
            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
              Realtime Synchronized
            </h5>
            <p className="text-[11px] text-slate-500 mt-1">
              Firestore onSnapshot pushes status milestones to all screens instantly.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <Lock className="w-5 h-5 text-purple-600 mb-2" />
            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
              Atomic Transactions
            </h5>
            <p className="text-[11px] text-slate-500 mt-1">
              Firestore transactions prevent double-acceptance race conditions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <MapPin className="w-5 h-5 text-amber-600 mb-2" />
            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
              Pakistan City Hubs
            </h5>
            <p className="text-[11px] text-slate-500 mt-1">
              Verified geographic presets from NED University, Saddar, Clifton, to Nazimabad.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 bg-white/50 dark:bg-slate-900/50">
        <p>LogiPulse © 2026. Built with Next.js App Router, TypeScript, Tailwind CSS & Firebase Cloud Firestore.</p>
      </footer>
    </div>
  );
}
