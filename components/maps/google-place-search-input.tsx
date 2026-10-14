"use client";

import React, { useEffect, useRef, useState } from "react";
import { GeoLocation } from "@/types";
import { loadGoogleMaps } from "@/lib/google-maps";
import { KARACHI_LOCATIONS } from "@/constants";
import { MapPin, Search, Navigation, CheckCircle2, ChevronDown } from "lucide-react";

interface GooglePlaceSearchInputProps {
  id: string;
  label: string;
  value: string;
  coords: GeoLocation;
  onChange: (address: string, coords: GeoLocation) => void;
  placeholder?: string;
  iconType?: "pickup" | "delivery";
}

export function GooglePlaceSearchInput({
  id,
  label,
  value,
  coords,
  onChange,
  placeholder = "Search street, landmark, area in Karachi...",
  iconType = "pickup",
}: GooglePlaceSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initAutocomplete() {
      try {
        const googleMaps = await loadGoogleMaps();
        if (!isMounted || !inputRef.current) return;

        setIsGoogleLoaded(true);

        // Restrict autocomplete bounds to Karachi metropolitan region
        const karachiBounds = new googleMaps.LatLngBounds(
          new googleMaps.LatLng(24.75, 66.85),
          new googleMaps.LatLng(25.15, 67.35)
        );

        const autocomplete = new googleMaps.places.Autocomplete(inputRef.current, {
          bounds: karachiBounds,
          componentRestrictions: { country: "pk" },
          fields: ["formatted_address", "geometry", "name"],
          strictBounds: false,
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const formattedAddress = place.formatted_address || place.name || value;
            onChange(formattedAddress, { latitude: lat, longitude: lng });
          }
        });

        autocompleteRef.current = autocomplete;
      } catch (err) {
        console.warn("Places autocomplete initialization notice:", err);
      }
    }

    initAutocomplete();

    return () => {
      isMounted = false;
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handlePresetSelect = (preset: (typeof KARACHI_LOCATIONS)[0]) => {
    onChange(preset.address, {
      latitude: preset.latitude,
      longitude: preset.longitude,
    });
    setShowPresets(false);
  };

  const isPickup = iconType === "pickup";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isPickup ? "bg-blue-500" : "bg-teal-500"
            }`}
          />
          {label}
        </label>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
          GPS: {coords.latitude.toFixed(3)}, {coords.longitude.toFixed(3)}
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          {isPickup ? (
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <Navigation className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          )}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) =>
            onChange(e.target.value, coords)
          }
          placeholder={placeholder}
          required
          className="w-full pl-9 pr-24 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isGoogleLoaded && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
              title="Powered by Google Places Autocomplete"
            >
              Google
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition text-[11px] font-medium flex items-center gap-0.5"
            title="Choose from popular Karachi landmarks"
          >
            <span>Hubs</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Preset Karachi Hubs Dropdown */}
      {showPresets && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-30 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quick Karachi Delivery Hubs
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {KARACHI_LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => handlePresetSelect(loc)}
                className="text-left px-2.5 py-1.5 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between group"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    {loc.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                    {loc.address}
                  </p>
                </div>
                {coords.latitude === loc.latitude && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
