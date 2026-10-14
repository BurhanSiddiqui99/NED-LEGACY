"use client";

import React, { useEffect, useRef, useState } from "react";
import { GeoLocation } from "@/types";
import { loadGoogleMaps, isWithinKarachi, KARACHI_BOUNDS } from "@/lib/google-maps";
import { KARACHI_LOCATIONS } from "@/constants";
import { MapPin, Search, Navigation, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  placeholder = "Search street, landmark, area in Karachi, Pakistan...",
  iconType = "pickup",
}: GooglePlaceSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initAutocomplete() {
      try {
        const googleMaps = await loadGoogleMaps();
        if (!isMounted || !inputRef.current) return;

        setIsGoogleLoaded(true);

        // Strictly restrict autocomplete bounds to Karachi metropolitan region
        const karachiBounds = new googleMaps.LatLngBounds(
          new googleMaps.LatLng(KARACHI_BOUNDS.south, KARACHI_BOUNDS.west),
          new googleMaps.LatLng(KARACHI_BOUNDS.north, KARACHI_BOUNDS.east)
        );

        const autocomplete = new googleMaps.places.Autocomplete(inputRef.current, {
          bounds: karachiBounds,
          componentRestrictions: { country: "pk" },
          fields: ["formatted_address", "geometry", "name", "address_components"],
          strictBounds: true, // STRICTLY KARACHI ONLY
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            // Strict Karachi boundary validation
            if (!isWithinKarachi(lat, lng)) {
              toast.error(
                "Selected location is outside Karachi! LogiPulse currently operates exclusively within Karachi, Pakistan."
              );
              return;
            }

            const formattedAddress = place.formatted_address || place.name || value;
            onChange(formattedAddress, { latitude: lat, longitude: lng });
            toast.success(`Location set: ${place.name || formattedAddress.split(",")[0]}`);
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

  // Geocode manual text input strictly inside Karachi
  const handleSearchManual = async () => {
    if (!value.trim()) return;
    setSearching(true);

    try {
      const googleMaps = await loadGoogleMaps();
      const geocoder = new googleMaps.Geocoder();

      const karachiBounds = new googleMaps.LatLngBounds(
        new googleMaps.LatLng(KARACHI_BOUNDS.south, KARACHI_BOUNDS.west),
        new googleMaps.LatLng(KARACHI_BOUNDS.north, KARACHI_BOUNDS.east)
      );

      const query = value.toLowerCase().includes("karachi")
        ? value
        : `${value}, Karachi, Pakistan`;

      geocoder.geocode(
        {
          address: query,
          bounds: karachiBounds,
          componentRestrictions: { country: "PK" },
        },
        (results, status) => {
          setSearching(false);
          if (status === "OK" && results && results[0]) {
            const loc = results[0].geometry.location;
            const lat = loc.lat();
            const lng = loc.lng();

            if (!isWithinKarachi(lat, lng)) {
              toast.error("Location found is outside Karachi! Please specify a Karachi area or landmark.");
              return;
            }

            onChange(results[0].formatted_address, { latitude: lat, longitude: lng });
            toast.success(`Found in Karachi: ${results[0].formatted_address.split(",")[0]}`);
          } else {
            toast.error("Location not found in Karachi. Try selecting from Karachi Hubs or refine keywords.");
          }
        }
      );
    } catch (err) {
      setSearching(false);
      console.warn("Geocoding notice:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchManual();
    }
  };

  const handlePresetSelect = (preset: (typeof KARACHI_LOCATIONS)[0]) => {
    onChange(preset.address, {
      latitude: preset.latitude,
      longitude: preset.longitude,
    });
    setShowPresets(false);
    toast.success(`Selected Karachi Hub: ${preset.name}`);
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
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            Karachi Only
          </span>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
            GPS: {coords.latitude.toFixed(3)}, {coords.longitude.toFixed(3)}
          </span>
        </div>
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
          onChange={(e) => onChange(e.target.value, coords)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required
          className="w-full pl-9 pr-28 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Search Button */}
          <button
            type="button"
            onClick={handleSearchManual}
            disabled={searching}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition text-[11px] font-medium flex items-center gap-1 shadow-sm disabled:opacity-50"
            title="Search this address strictly in Karachi"
          >
            {searching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Find</span>
          </button>

          {/* Quick Hubs Dropdown */}
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-[11px] font-medium flex items-center gap-0.5"
            title="Choose popular Karachi hubs"
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
            Popular Karachi Verified Delivery Hubs
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto">
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
