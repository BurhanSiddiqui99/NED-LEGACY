"use client";

import React, { useState } from "react";
import { KARACHI_LOCATIONS } from "@/constants";
import { GeoLocation } from "@/types";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LocationSelectorProps {
  currentLocation: GeoLocation;
  onLocationChange: (loc: GeoLocation, name?: string) => void;
}

export function LocationSelector({
  currentLocation,
  onLocationChange,
}: LocationSelectorProps) {
  const [detecting, setDetecting] = useState(false);

  // Find if current coordinates match a preset
  const matchedPreset = KARACHI_LOCATIONS.find(
    (l) =>
      Math.abs(l.latitude - currentLocation.latitude) < 0.005 &&
      Math.abs(l.longitude - currentLocation.longitude) < 0.005
  );

  const handlePresetSelect = (presetId: string) => {
    const loc = KARACHI_LOCATIONS.find((l) => l.id === presetId);
    if (loc) {
      onLocationChange({ latitude: loc.latitude, longitude: loc.longitude }, loc.name);
      toast.success(`Rider location updated to: ${loc.name}`);
    }
  };

  const handleUseBrowserGPS = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Browser geolocation not supported on this device.");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetecting(false);
        const { latitude, longitude } = pos.coords;
        onLocationChange({ latitude, longitude }, "GPS Current Device Location");
        toast.success("Rider position updated from device GPS!");
      },
      (err) => {
        setDetecting(false);
        toast.error(`GPS Error: ${err.message}. Using landmark preset fallback.`);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Rider Live Position
          </span>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {matchedPreset ? matchedPreset.name : "Custom GPS Location"} (
            {currentLocation.latitude.toFixed(3)}, {currentLocation.longitude.toFixed(3)})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <select
          value={matchedPreset ? matchedPreset.id : "custom"}
          onChange={(e) => handlePresetSelect(e.target.value)}
          className="flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          {KARACHI_LOCATIONS.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
          {!matchedPreset && <option value="custom">Device GPS Coords</option>}
        </select>

        <button
          type="button"
          onClick={handleUseBrowserGPS}
          disabled={detecting}
          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 shrink-0"
          title="Detect live browser GPS"
        >
          {detecting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-blue-500" />
          )}
          <span>GPS</span>
        </button>
      </div>
    </div>
  );
}
