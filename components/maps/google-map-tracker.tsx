"use client";

import React, { useEffect, useRef, useState } from "react";
import { GeoLocation, OrderStatus } from "@/types";
import {
  loadGoogleMaps,
  createMapIcon,
  DARK_MAP_STYLE,
  LIGHT_MAP_STYLE,
  PAKISTAN_DEFAULT_CENTER,
  escapeHtml,
} from "@/lib/google-maps";
import { formatRelativeTime } from "@/lib/utils";
import {
  Navigation,
  MapPin,
  Bike,
  Maximize2,
  RefreshCw,
  AlertCircle,
  Layers,
  Crosshair,
} from "lucide-react";

interface GoogleMapTrackerProps {
  pickupLocation: GeoLocation;
  pickupAddress?: string;
  deliveryLocation: GeoLocation;
  deliveryAddress?: string;
  riderLocation?: GeoLocation | null;
  riderName?: string;
  riderUpdatedAt?: any;
  status: OrderStatus;
  height?: string;
  interactive?: boolean;
}

export function GoogleMapTracker({
  pickupLocation,
  pickupAddress,
  deliveryLocation,
  deliveryAddress,
  riderLocation,
  riderName,
  riderUpdatedAt,
  status,
  height = "380px",
  interactive = true,
}: GoogleMapTrackerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{
    pickup?: google.maps.Marker;
    delivery?: google.maps.Marker;
    rider?: google.maps.Marker;
  }>({});
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [followRider, setFollowRider] = useState(false);
  // Re-render every 15 s so "updated Xs ago" stays fresh between location writes
  const [, setClock] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setClock((c) => c + 1), 15000);
    return () => clearInterval(id);
  }, []);

  // Detect dark mode from document class
  const isDarkMode =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      try {
        setLoading(true);
        const googleMaps = await loadGoogleMaps();
        if (!isMounted || !mapContainerRef.current) return;

        const centerLat = pickupLocation?.latitude || PAKISTAN_DEFAULT_CENTER.lat;
        const centerLng = pickupLocation?.longitude || PAKISTAN_DEFAULT_CENTER.lng;

        // Initialize Map
        const map = new googleMaps.Map(mapContainerRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 13,
          styles: isDarkMode ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
          disableDefaultUI: !interactive,
          zoomControl: interactive,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;

        // Add Pickup Marker
        const pickupMarker = new googleMaps.Marker({
          position: {
            lat: pickupLocation.latitude,
            lng: pickupLocation.longitude,
          },
          map,
          title: `Pickup: ${pickupAddress || "Origin Point"}`,
          icon: createMapIcon("pickup"),
          animation: googleMaps.Animation.DROP,
        });

        const pickupInfoWindow = new googleMaps.InfoWindow({
          content: `
            <div style="color: #0f172a; font-family: sans-serif; padding: 4px; font-size: 12px;">
              <strong style="color: #0284c7;">📍 Pickup Location</strong>
              <p style="margin: 4px 0 0; color: #475569;">${escapeHtml(pickupAddress || "Pickup point")}</p>
            </div>
          `,
        });

        pickupMarker.addListener("click", () => {
          pickupInfoWindow.open(map, pickupMarker);
        });

        markersRef.current.pickup = pickupMarker;

        // Add Delivery Destination Marker
        const deliveryMarker = new googleMaps.Marker({
          position: {
            lat: deliveryLocation.latitude,
            lng: deliveryLocation.longitude,
          },
          map,
          title: `Destination: ${deliveryAddress || "Delivery Target"}`,
          icon: createMapIcon("delivery"),
          animation: googleMaps.Animation.DROP,
        });

        const deliveryInfoWindow = new googleMaps.InfoWindow({
          content: `
            <div style="color: #0f172a; font-family: sans-serif; padding: 4px; font-size: 12px;">
              <strong style="color: #059669;">🏁 Delivery Destination</strong>
              <p style="margin: 4px 0 0; color: #475569;">${escapeHtml(deliveryAddress || "Destination")}</p>
            </div>
          `,
        });

        deliveryMarker.addListener("click", () => {
          deliveryInfoWindow.open(map, deliveryMarker);
        });

        markersRef.current.delivery = deliveryMarker;

        // Fit map bounds to show both pins
        const bounds = new googleMaps.LatLngBounds();
        bounds.extend({ lat: pickupLocation.latitude, lng: pickupLocation.longitude });
        bounds.extend({ lat: deliveryLocation.latitude, lng: deliveryLocation.longitude });

        // Add Rider Marker if active
        if (riderLocation) {
          const riderMarker = new googleMaps.Marker({
            position: { lat: riderLocation.latitude, lng: riderLocation.longitude },
            map,
            title: `Courier: ${riderName || "Active Rider"}`,
            icon: createMapIcon("rider"),
            zIndex: 999,
          });

          const riderInfoWindow = new googleMaps.InfoWindow({
            content: `
              <div style="color: #0f172a; font-family: sans-serif; padding: 4px; font-size: 12px;">
                <strong style="color: #7c3aed;">🛵 Courier On The Move</strong>
                <p style="margin: 4px 0 0; color: #475569;"><strong>${escapeHtml(riderName || "Rider")}</strong> is on the way.</p>
              </div>
            `,
          });

          riderMarker.addListener("click", () => {
            riderInfoWindow.open(map, riderMarker);
          });

          markersRef.current.rider = riderMarker;
          bounds.extend({ lat: riderLocation.latitude, lng: riderLocation.longitude });
        }

        map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });

        // Draw Route Line
        const pathCoords = [
          { lat: pickupLocation.latitude, lng: pickupLocation.longitude },
          ...(riderLocation
            ? [{ lat: riderLocation.latitude, lng: riderLocation.longitude }]
            : []),
          { lat: deliveryLocation.latitude, lng: deliveryLocation.longitude },
        ];

        const polyline = new googleMaps.Polyline({
          path: pathCoords,
          geodesic: true,
          strokeColor: "#2563EB",
          strokeOpacity: 0.85,
          strokeWeight: 4,
          map,
        });

        polylineRef.current = polyline;
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.warn("Google Maps init notice:", err);
        setLoadError(err?.message || "Failed to load Google Maps");
        setLoading(false);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      // Cleanup markers & polyline
      if (markersRef.current.pickup) markersRef.current.pickup.setMap(null);
      if (markersRef.current.delivery) markersRef.current.delivery.setMap(null);
      if (markersRef.current.rider) markersRef.current.rider.setMap(null);
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, [
    pickupLocation.latitude,
    pickupLocation.longitude,
    deliveryLocation.latitude,
    deliveryLocation.longitude,
    isDarkMode,
  ]);

  // Move the rider pin whenever a new live location arrives from Firestore
  useEffect(() => {
    if (loading || !mapInstanceRef.current || !window.google?.maps) return;

    const pickup = { lat: pickupLocation.latitude, lng: pickupLocation.longitude };
    const dropoff = { lat: deliveryLocation.latitude, lng: deliveryLocation.longitude };

    if (!riderLocation) {
      if (markersRef.current.rider) {
        markersRef.current.rider.setMap(null);
        markersRef.current.rider = undefined;
      }
      polylineRef.current?.setPath([pickup, dropoff]);
      return;
    }

    const position = { lat: riderLocation.latitude, lng: riderLocation.longitude };
    if (markersRef.current.rider) {
      markersRef.current.rider.setPosition(position);
    } else {
      markersRef.current.rider = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: `Courier: ${riderName || "Active Rider"}`,
        icon: createMapIcon("rider"),
        zIndex: 999,
      });
    }

    // Before pickup the route runs rider -> pickup -> drop-off, afterwards pickup -> rider -> drop-off
    polylineRef.current?.setPath(
      status === "accepted" ? [position, pickup, dropoff] : [pickup, position, dropoff]
    );

    if (followRider) {
      mapInstanceRef.current.panTo(position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderLocation?.latitude, riderLocation?.longitude, riderName, status, loading, followRider]);

  const handleCenterRider = () => {
    if (!mapInstanceRef.current) return;
    if (riderLocation) {
      mapInstanceRef.current.panTo({
        lat: riderLocation.latitude,
        lng: riderLocation.longitude,
      });
      mapInstanceRef.current.setZoom(15);
    } else {
      mapInstanceRef.current.panTo({
        lat: pickupLocation.latitude,
        lng: pickupLocation.longitude,
      });
      mapInstanceRef.current.setZoom(14);
    }
  };

  const handleToggleMapType = () => {
    if (!mapInstanceRef.current) return;
    const nextType = mapType === "roadmap" ? "satellite" : "roadmap";
    mapInstanceRef.current.setMapTypeId(nextType);
    setMapType(nextType);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-slate-950">
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height }}
        className="w-full h-full relative"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
          <span className="text-xs font-semibold tracking-wide">
            Initializing Live Google Maps...
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Connecting real-time courier telemetry
          </span>
        </div>
      )}

      {/* Error Fallback Banner if API key domain restricted */}
      {loadError && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center text-white z-20">
          <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
          <h4 className="text-sm font-bold text-white">Google Maps could not load</h4>
          <p className="text-xs text-slate-300 max-w-sm mt-1">
            Check the Maps API key / allowed domains. Route coordinates: ({pickupLocation.latitude.toFixed(3)},{" "}
            {pickupLocation.longitude.toFixed(3)} → {deliveryLocation.latitude.toFixed(3)},{" "}
            {deliveryLocation.longitude.toFixed(3)})
          </p>
          <div className="mt-4 flex items-center gap-3 text-xs bg-slate-800 px-3 py-2 rounded-xl">
            <span className="flex items-center gap-1 text-blue-400">
              <MapPin className="w-3.5 h-3.5" /> {pickupAddress || "Pickup"}
            </span>
            <span>→</span>
            <span className="flex items-center gap-1 text-teal-400">
              <MapPin className="w-3.5 h-3.5" /> {deliveryAddress || "Destination"}
            </span>
          </div>
        </div>
      )}

      {/* Real-time Map Badges & Overlay Controls */}
      {!loading && !loadError && (
        <>
          {/* Top Left Live Status Pill */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <div className="bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/10 shadow-lg text-[11px] font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Realtime Delivery Radar</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 uppercase tracking-wider font-bold">
                {status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Top Right Map Control Buttons */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            {riderLocation && (
              <button
                onClick={() => setFollowRider(!followRider)}
                className={`p-2 rounded-xl border border-white/10 shadow-lg text-xs font-medium transition flex items-center gap-1 ${
                  followRider ? "bg-purple-600 text-white" : "bg-slate-900/90 hover:bg-slate-800 text-white"
                }`}
                title="Keep the map centred on the rider"
                aria-pressed={followRider}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Follow</span>
              </button>
            )}
            <button
              onClick={handleCenterRider}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/10 shadow-lg text-xs font-medium transition flex items-center gap-1"
              title="Focus on Rider / Pickup"
            >
              <Navigation className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Center</span>
            </button>

            <button
              onClick={handleToggleMapType}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/10 shadow-lg text-xs font-medium transition flex items-center gap-1"
              title="Toggle Roadmap / Satellite View"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline capitalize">{mapType}</span>
            </button>
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
            <div className="bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl border border-white/10 shadow-lg text-xs flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="truncate max-w-[120px] sm:max-w-[180px]">
                  {pickupAddress || "Pickup Point"}
                </span>
              </div>
              <span className="text-slate-500">→</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="truncate max-w-[120px] sm:max-w-[180px]">
                  {deliveryAddress || "Destination"}
                </span>
              </div>
            </div>

            {riderLocation && (
              <div className="bg-purple-950/90 backdrop-blur-md text-purple-200 border border-purple-800 px-3 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 pointer-events-auto shadow-lg shrink-0">
                <Bike className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
                <span className="hidden sm:inline">Rider Live:</span>
                <span>{riderName || "Courier"}</span>
                {riderUpdatedAt && (
                  <span className="text-[10px] font-medium text-purple-300">
                    • {formatRelativeTime(riderUpdatedAt)}
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
