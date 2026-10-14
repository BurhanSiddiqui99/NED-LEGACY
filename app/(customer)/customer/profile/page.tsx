"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { formatDateTime } from "@/lib/utils";
import { User, Mail, Phone, ShieldCheck, MapPin, Calendar } from "lucide-react";

export default function CustomerProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Customer Account & Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your registered sender identity and verified account details.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Header with avatar */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#027A48] via-[#039855] to-[#12B76A] text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/20">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "C"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {user?.fullName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                Verified Customer
              </span>
            </div>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        {/* Profile info fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-blue-500" /> Contact Phone
            </span>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {user?.phone || "+92 300 0000000"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
              <Mail className="w-3.5 h-3.5 text-teal-500" /> Account Email
            </span>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {user?.email}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Account Status
            </span>
            <p className="font-semibold text-emerald-600 text-sm">
              Active & Verified
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-purple-500" /> Member Since
            </span>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {formatDateTime(user?.createdAt)}
            </p>
          </div>
        </div>

        {/* Service Area */}
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Service Area: All of Pakistan</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Book pickups and drop-offs in any Pakistani city, including Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar and Quetta.
          </p>
        </div>
      </div>
    </div>
  );
}
