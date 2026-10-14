import React from "react";
import { LoginForm } from "@/components/auth/login-form";
import { ParcelCube3D } from "@/components/animations/parcel-cube-3d";
import { Radio, MapPin, Flame, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#039855] via-[#027A48] to-[#022C1B] flex items-center justify-center p-4">
      {/* Ambient background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="lp-blob w-96 h-96 bg-blue-500 -top-32 -left-24" />
        <div className="lp-blob w-80 h-80 bg-teal-500 bottom-0 right-0" style={{ animationDelay: "-8s" }} />
      </div>

      <div className="relative w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
        {/* Showcase (desktop) */}
        <div className="hidden lg:flex flex-col items-center text-center text-white">
          <ParcelCube3D size={150} />
          <h2 className="mt-10 text-3xl font-black tracking-tight">
            Every parcel, <span className="text-teal-300">live.</span>
          </h2>
          <p className="mt-2 text-sm text-slate-300 max-w-sm">
            Book, dispatch and track couriers across Pakistan with real-time maps, chat and priority routing.
          </p>
          <ul className="mt-6 space-y-2 text-xs text-slate-200 text-left">
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-300" /> Smart nearby pickup by real distance
            </li>
            <li className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-300" /> Normal / High / Urgent priority dispatch
            </li>
            <li className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-300" /> Realtime customer ↔ rider chat
            </li>
          </ul>
        </div>

        <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#027A48] to-[#12B76A] flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition">
                <Radio className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-2xl text-white tracking-tight block">LogiPulse</span>
                <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                  Pakistan Logistics Portal
                </span>
              </div>
            </Link>
            <h1 className="text-xl font-bold text-white mt-4">Welcome Back</h1>
            <p className="text-xs text-slate-400 mt-1">Sign in to access your role-based logistics dashboard</p>
          </div>

          {/* Card Form */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
