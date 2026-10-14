"use client";

import React, { useEffect, useRef, useState } from "react";
import { GeoLocation } from "@/types";
import { loadGoogleMaps, isWithinPakistan, PAKISTAN_BOUNDS } from "@/lib/google-maps";
import { MapPin, Search, Navigation, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { WAREHOUSES } from "@/lib/logistics";
import { toast } from "sonner";

interface GooglePlaceSearchInputProps {
  id: string;
  label: string;
  value: string;
  // null until the address has been located for the first time
  coords: GeoLocation | null;
  // `resolved` is false while the text was typed but not yet located on the map
  onChange: (address: string, coords: GeoLocation | null, resolved: boolean) => void;
  resolved?: boolean;
  placeholder?: string;
  iconType?: "pickup" | "delivery";
}

export function GooglePlaceSearchInput({
  id,
  label,
  value,
  coords,
  onChange,
  resolved = true,
  placeholder = "Search street, landmark, area or city in Pakistan...",
  iconType = "pickup",
}: GooglePlaceSearchInputProps) {
  // The autocomplete listener is registered once; keep it pointed at the latest onChange
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Latest values for the delayed blur check below
  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initAutocomplete() {
      try {
        const googleMaps = await loadGoogleMaps();
        if (!isMounted || !inputRef.current) return;

        // Restrict autocomplete suggestions to Pakistan (any city)
        const pakistanBounds = new googleMaps.LatLngBounds(
          new googleMaps.LatLng(PAKISTAN_BOUNDS.south, PAKISTAN_BOUNDS.west),
          new googleMaps.LatLng(PAKISTAN_BOUNDS.north, PAKISTAN_BOUNDS.east)
        );

        const autocomplete = new googleMaps.places.Autocomplete(inputRef.current, {
          bounds: pakistanBounds,
          componentRestrictions: { country: "pk" },
          fields: ["formatted_address", "geometry", "name", "address_components"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            if (!isWithinPakistan(lat, lng)) {
              toast.error("Selected location is outside Pakistan. LogiPulse operates within Pakistan only.");
              return;
            }

            const formattedAddress = place.formatted_address || place.name || inputRef.current?.value || "";
            onChangeRef.current(formattedAddress, { latitude: lat, longitude: lng }, true);
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

  /**
   * Without Google geocoding (API off, no match), fall back to the city named in the text:
   * "Gulberg, Lahore" is placed at the Lahore city centre so the city (and price / routing) is still right.
   */
  const cityFallback = (): boolean => {
    const text = value.toLowerCase();
    const city = WAREHOUSES.find((w) => text.includes(w.city.toLowerCase()));
    if (!city) return false;
    onChange(value, { latitude: city.latitude, longitude: city.longitude }, true);
    toast.info(`Exact address not found. Using ${city.city} city centre; pick a suggestion for a precise pin.`);
    return true;
  };

  // Geocode manual text input anywhere inside Pakistan
  const handleSearchManual = async () => {
    if (!value.trim()) return;
    setSearching(true);

    try {
      const googleMaps = await loadGoogleMaps();
      const geocoder = new googleMaps.Geocoder();

      const pakistanBounds = new googleMaps.LatLngBounds(
        new googleMaps.LatLng(PAKISTAN_BOUNDS.south, PAKISTAN_BOUNDS.west),
        new googleMaps.LatLng(PAKISTAN_BOUNDS.north, PAKISTAN_BOUNDS.east)
      );

      const query = value.toLowerCase().includes("pakistan") ? value : `${value}, Pakistan`;

      geocoder.geocode(
        {
          address: query,
          bounds: pakistanBounds,
          componentRestrictions: { country: "PK" },
        },
        (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
          setSearching(false);
          if (status === "OK" && results && results[0]) {
            const loc = results[0].geometry.location;
            const lat = loc.lat();
            const lng = loc.lng();

            if (!isWithinPakistan(lat, lng)) {
              toast.error("Location found is outside Pakistan. Please enter a Pakistani city, area or landmark.");
              return;
            }

            onChange(results[0].formatted_address, { latitude: lat, longitude: lng }, true);
            toast.success(`Found: ${results[0].formatted_address.split(",")[0]}`);
          } else if (!cityFallback()) {
            toast.error("Location not found. Add the city name (e.g. \"Gulberg, Lahore\") or pick a suggestion.");
          }
        }
      );
    } catch (err) {
      setSearching(false);
      console.warn("Geocoding notice:", err);
      if (!cityFallback()) toast.error("Could not search this address. Pick a suggestion from the list.");
    }
  };

  const searchRef = useRef(handleSearchManual);
  searchRef.current = handleSearchManual;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchManual();
    }
  };

  const isPickup = iconType === "pickup";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {resolved && coords && value.trim() && (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Located on map
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
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
          autoComplete="off"
          onChange={(e) => onChange(e.target.value, coords, false)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Locate typed text automatically when the field loses focus (ignore clicks into the suggestions list)
            if (!resolved && value.trim().length >= 3) {
              setTimeout(() => {
                if (!resolvedRef.current) searchRef.current();
              }, 300);
            }
          }}
          aria-invalid={!resolved && !!value.trim()}
          placeholder={placeholder}
          required
          className={`w-full pl-10 pr-24 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:bg-white dark:focus:bg-slate-900 ${
            resolved || !value.trim() ? "border-slate-200 dark:border-slate-700" : "border-amber-400 dark:border-amber-600"
          }`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={handleSearchManual}
            disabled={searching || !value.trim()}
            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition text-xs font-semibold flex items-center gap-1 shadow-sm disabled:opacity-50"
            title="Search this address anywhere in Pakistan"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Find</span>
          </button>
        </div>
      </div>

      {!resolved && value.trim() && (
        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> Not located yet. Pick a suggestion from the list or press Find.
        </p>
      )}
    </div>
  );
}
