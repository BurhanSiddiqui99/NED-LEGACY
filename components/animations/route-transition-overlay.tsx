"use client";

import React from "react";
import { ParcelScene } from "./parcel-scenes";

/** Full-screen hand-off shown between a successful action (e.g. sign-in) and the next page painting. */
export function RouteTransitionOverlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-gradient-to-br from-[#039855] via-[#027A48] to-[#022C1B] animate-in fade-in duration-200">
      <div className="text-white">
        <ParcelScene variant="transit" size={260} className="!text-slate-200" />
      </div>
      <p className="mt-4 text-sm font-bold text-white tracking-tight">{label}</p>
      <div className="mt-3 w-48 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-[#027A48] to-[#12B76A] lp-progress" />
      </div>
    </div>
  );
}
