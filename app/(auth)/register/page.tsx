import React from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { Radio } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#039855] via-[#027A48] to-[#022C1B] flex flex-col items-center justify-center p-4 py-8">
      <div className="max-w-lg w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#027A48] to-[#12B76A] flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition">
              <Radio className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-2xl text-white tracking-tight block">
                LogiPulse
              </span>
              <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                Registration Portal
              </span>
            </div>
          </Link>
          <h2 className="text-xl font-bold text-white mt-4">Create an Account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Register as a Customer to send deliveries or Rider to join the fleet
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/20">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
