"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { GeoLocation, OrderStatus } from "@/types";
import {
  loadGoogleMaps,
  createMapIcon,
  DARK_MAP_STYLE,
  LIGHT_MAP_STYLE,
  PAKISTAN_DEFAULT_CENTER,
  escapeHtml,
} from "@/lib/google-maps";
import { getRoadRoute, locateOnPath, pathLengthKm, LatLng, RouteResult } from "@/lib/routing";
import { formatRelativeTime } from "@/lib/utils";
import { RIDER_MOVING_STATUSES } from "@/lib/logistics";
import { TripTimeline, TimelineStop } from "./trip-timeline";
import { Navigation, MapPin, Bike, RefreshCw, AlertCircle, Layers, Crosshair } from "lucide-react";

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
  // Google-Maps-style ETA + stops + turn-by-turn panel under the map
  showTimeline?: boolean;
  // True while the rider is still riding to the start of the leg (pickup point or warehouse)
  riderHeadingToStart?: boolean;
}

// Re-route only when the rider strays this far from the current road route
const OFF_ROUTE_KM = 0.2;

const ROUTE_BLUE = "#12B76A";
const ROUTE_BORDER = "#027A48";
const ROUTE_DONE = "#10B981";

function toLatLng(g: GeoLocation): LatLng {
  return { lat: g.latitude, lng: g.longitude };
}

/** Glides a marker to its new position instead of jumping. */
function animateMarker(marker: google.maps.Marker, to: LatLng, durationMs = 900) {
  const fromPos = marker.getPosition();
  if (!fromPos) {
    marker.setPosition(to);
    return;
  }
  const from = { lat: fromPos.lat(), lng: fromPos.lng() };
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs);
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    marker.setPosition({ lat: from.lat + (to.lat - from.lat) * e, lng: from.lng + (to.lng - from.lng) * e });
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
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
  showTimeline = false,
  riderHeadingToStart,
}: GoogleMapTrackerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{ pickup?: google.maps.Marker; delivery?: google.maps.Marker; rider?: google.maps.Marker }>({});
  const linesRef = useRef<{ border?: google.maps.Polyline; main?: google.maps.Polyline; trail?: google.maps.Polyline }>({});
  const fittedKeyRef = useRef<string | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [followRider, setFollowRider] = useState(false);
  const [route, setRoute] = useState<{ key: string; result: RouteResult } | null>(null);
  const [routeLoading, setRouteLoading] = useState(true);
  const [trail, setTrail] = useState<LatLng[]>([]);
  // Re-render every 15 s so relative times and ETAs stay fresh between updates
  const [, setClock] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setClock((c) => c + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const isDarkMode = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const finished = status === "delivered" || status === "cancelled";
  const riderActive = Boolean(riderLocation) && RIDER_MOVING_STATUSES.includes(status);

  // Which stops the route goes through for the current stage of the delivery
  const headingToStart = riderHeadingToStart ?? status === "accepted";
  const routeMode = !riderActive ? "trip" : headingToStart ? "to-pickup" : "to-dropoff";
  const modeKey = `${routeMode}|${pickupLocation.latitude},${pickupLocation.longitude}|${deliveryLocation.latitude},${deliveryLocation.longitude}`;

  /* ---------------- 1. Map + static markers ---------------- */
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const gm = await loadGoogleMaps();
        if (!mounted || !mapContainerRef.current) return;

        const map = new gm.Map(mapContainerRef.current, {
          center: {
            lat: pickupLocation?.latitude || PAKISTAN_DEFAULT_CENTER.lat,
            lng: pickupLocation?.longitude || PAKISTAN_DEFAULT_CENTER.lng,
          },
          zoom: 13,
          styles: isDarkMode ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
          disableDefaultUI: !interactive,
          zoomControl: interactive,
          gestureHandling: "cooperative",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;

        const addStop = (pos: GeoLocation, kind: "pickup" | "delivery", title: string, color: string, text: string) => {
          const marker = new gm.Marker({
            position: toLatLng(pos),
            map,
            title,
            icon: createMapIcon(kind),
            animation: gm.Animation.DROP,
            zIndex: 50,
          });
          const info = new gm.InfoWindow({
            content: `<div style="color:#0f172a;font-family:sans-serif;padding:4px;font-size:12px;"><strong style="color:${color};">${title}</strong><p style="margin:4px 0 0;color:#475569;">${escapeHtml(text)}</p></div>`,
          });
          marker.addListener("click", () => info.open(map, marker));
          return marker;
        };
        markersRef.current.pickup = addStop(pickupLocation, "pickup", "📍 Pickup", "#039855", pickupAddress || "Pickup point");
        markersRef.current.delivery = addStop(deliveryLocation, "delivery", "🏁 Drop-off", "#F97316", deliveryAddress || "Destination");

        // Google-style route: a darker border line under the main blue line, plus a dashed trail
        linesRef.current.border = new gm.Polyline({ map, strokeColor: ROUTE_BORDER, strokeWeight: 9, strokeOpacity: 0.9, zIndex: 1 });
        linesRef.current.main = new gm.Polyline({ map, strokeColor: ROUTE_BLUE, strokeWeight: 5.5, strokeOpacity: 1, zIndex: 2 });
        linesRef.current.trail = new gm.Polyline({
          map,
          strokeOpacity: 0,
          zIndex: 3,
          icons: [
            {
              icon: { path: "M 0,-1 0,1", strokeOpacity: 0.9, strokeColor: "#94A3B8", scale: 3 },
              offset: "0",
              repeat: "12px",
            },
          ],
        });

        const bounds = new gm.LatLngBounds();
        bounds.extend(toLatLng(pickupLocation));
        bounds.extend(toLatLng(deliveryLocation));
        map.fitBounds(bounds, 60);

        setMapReady(true);
      } catch (err: any) {
        if (!mounted) return;
        console.warn("Google Maps init notice:", err);
        setLoadError(err?.message || "Failed to load Google Maps");
      }
    }

    init();

    return () => {
      mounted = false;
      setMapReady(false);
      Object.values(markersRef.current).forEach((m) => m?.setMap(null));
      Object.values(linesRef.current).forEach((l) => l?.setMap(null));
      markersRef.current = {};
      linesRef.current = {};
      fittedKeyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupLocation.latitude, pickupLocation.longitude, deliveryLocation.latitude, deliveryLocation.longitude, isDarkMode]);

  /* ---------------- 2. Road route (independent of the map, so the timeline works even if Maps fails) ---------------- */
  useEffect(() => {
    // Keep the current route while the rider stays on it; only re-route on a stage change or detour
    if (route && route.key === modeKey) {
      if (!riderActive || !riderLocation) return;
      const { offRouteKm } = locateOnPath(route.result.path, riderLocation);
      if (offRouteKm < OFF_ROUTE_KM) return;
    }

    const stops: GeoLocation[] =
      routeMode === "trip"
        ? [pickupLocation, deliveryLocation]
        : routeMode === "to-pickup"
        ? [riderLocation!, pickupLocation, deliveryLocation]
        : [riderLocation!, deliveryLocation];

    let cancelled = false;
    setRouteLoading(true);
    getRoadRoute(stops).then((result) => {
      if (cancelled) return;
      setRoute({ key: modeKey, result });
      setRouteLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeKey, riderLocation?.latitude, riderLocation?.longitude]);

  // Breadcrumb trail of where the rider has actually been
  useEffect(() => {
    if (!riderActive || !riderLocation) return;
    setTrail((t) => {
      const last = t[t.length - 1];
      if (last && last.lat === riderLocation.latitude && last.lng === riderLocation.longitude) return t;
      return [...t, toLatLng(riderLocation)].slice(-400);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderActive, riderLocation?.latitude, riderLocation?.longitude]);

  /* ---------------- 3. Remaining route trimmed at the rider + per-stop ETAs ---------------- */
  const progress = useMemo(() => {
    if (!route) return null;
    const { path, legs } = route.result;
    let startIdx = 0;
    let remainingPath = path;
    if (routeMode !== "trip" && riderLocation) {
      startIdx = locateOnPath(path, riderLocation).index;
      remainingPath = [toLatLng(riderLocation), ...path.slice(startIdx + 1)];
    }

    let legStart = 0;
    const remainingLegs = legs.map((leg) => {
      const from = Math.max(legStart, startIdx);
      const fullKm = pathLengthKm(path, legStart, leg.endIndex) || leg.distanceKm;
      const remKm = from >= leg.endIndex ? 0 : pathLengthKm(path, from, leg.endIndex);
      const ratio = fullKm > 0 ? Math.min(1, remKm / fullKm) : 0;
      legStart = leg.endIndex;
      return { km: leg.distanceKm * ratio, min: leg.durationMin * ratio, steps: leg.steps };
    });
    return { remainingPath, remainingLegs };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, routeMode, riderLocation?.latitude, riderLocation?.longitude]);

  /* ---------------- 4. Draw route, trail and rider marker ---------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !window.google?.maps) return;
    const { border, main, trail: trailLine } = linesRef.current;

    const path = progress?.remainingPath || [toLatLng(pickupLocation), toLatLng(deliveryLocation)];
    main?.setOptions({
      path,
      strokeColor: status === "delivered" ? ROUTE_DONE : ROUTE_BLUE,
      strokeOpacity: status === "cancelled" ? 0.35 : 1,
    });
    border?.setOptions({
      path,
      strokeColor: status === "delivered" ? "#047857" : ROUTE_BORDER,
      strokeOpacity: status === "cancelled" ? 0.2 : 0.9,
    });
    trailLine?.setPath(riderActive ? trail : []);

    // Rider marker
    if (riderActive && riderLocation) {
      const pos = toLatLng(riderLocation);
      if (markersRef.current.rider) {
        animateMarker(markersRef.current.rider, pos);
      } else {
        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          title: `Courier: ${riderName || "Active Rider"}`,
          icon: createMapIcon("rider"),
          zIndex: 999,
        });
        const info = new window.google.maps.InfoWindow({
          content: `<div style="color:#0f172a;font-family:sans-serif;padding:4px;font-size:12px;"><strong style="color:#12B76A;">🛵 ${escapeHtml(riderName || "Rider")}</strong><p style="margin:4px 0 0;color:#475569;">On the way</p></div>`,
        });
        marker.addListener("click", () => info.open(map, marker));
        markersRef.current.rider = marker;
      }
      if (followRider) map.panTo(pos);
    } else if (markersRef.current.rider) {
      markersRef.current.rider.setMap(null);
      markersRef.current.rider = undefined;
    }

    // Frame the whole route once per stage
    if (route && fittedKeyRef.current !== route.key && !followRider) {
      const bounds = new window.google.maps.LatLngBounds();
      route.result.path.forEach((p) => bounds.extend(p));
      bounds.extend(toLatLng(pickupLocation));
      bounds.extend(toLatLng(deliveryLocation));
      map.fitBounds(bounds, 60);
      fittedKeyRef.current = route.key;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, progress, trail, riderActive, riderLocation?.latitude, riderLocation?.longitude, status, followRider, riderName]);

  /* ---------------- Timeline data ---------------- */
  const timeline = useMemo(() => {
    const legs = progress?.remainingLegs || [];
    const stops: TimelineStop[] = [];
    let totalKm: number | null = null;
    let totalMin: number | null = null;
    let steps = legs[0]?.steps || [];

    if (routeMode === "trip") {
      const trip = legs[0];
      if (trip) {
        totalKm = trip.km;
        totalMin = trip.min;
      }
      const pickupDone = status !== "pending" && status !== "cancelled";
      stops.push({ key: "pickup", label: "Pickup", address: pickupAddress, state: pickupDone ? "done" : "current", km: 0, min: 0 });
      stops.push({
        key: "dropoff",
        label: "Drop-off",
        address: deliveryAddress,
        state: status === "delivered" ? "done" : "upcoming",
        km: trip?.km,
        min: trip?.min,
      });
    } else {
      stops.push({
        key: "rider",
        label: riderName || "Rider",
        address: riderUpdatedAt ? `Live · updated ${formatRelativeTime(riderUpdatedAt)}` : "Live position",
        state: "current",
      });
      if (routeMode === "to-pickup") {
        const [toPickup, toDrop] = legs;
        stops.push({ key: "pickup", label: "Collect", address: pickupAddress, state: "upcoming", km: toPickup?.km, min: toPickup?.min });
        stops.push({
          key: "dropoff",
          label: "Drop-off",
          address: deliveryAddress,
          state: "upcoming",
          km: (toPickup?.km || 0) + (toDrop?.km || 0),
          min: (toPickup?.min || 0) + (toDrop?.min || 0),
        });
        if (toPickup) {
          totalKm = toPickup.km;
          totalMin = toPickup.min;
        }
      } else {
        const [toDrop] = legs;
        stops.unshift({ key: "pickup", label: "Pickup", address: pickupAddress, state: "done" });
        stops.push({ key: "dropoff", label: "Drop-off", address: deliveryAddress, state: "upcoming", km: toDrop?.km, min: toDrop?.min });
        if (toDrop) {
          totalKm = toDrop.km;
          totalMin = toDrop.min;
        }
      }
    }
    if (finished) steps = [];
    return { stops, totalKm, totalMin, steps };
  }, [progress, routeMode, status, pickupAddress, deliveryAddress, riderName, riderUpdatedAt, finished]);

  const handleCenter = () => {
    const map = mapRef.current;
    if (!map) return;
    const target = riderActive && riderLocation ? riderLocation : pickupLocation;
    map.panTo(toLatLng(target));
    map.setZoom(15);
  };

  const handleToggleMapType = () => {
    if (!mapRef.current) return;
    const next = mapType === "roadmap" ? "satellite" : "roadmap";
    mapRef.current.setMapTypeId(next);
    setMapType(next);
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-slate-950">
        <div ref={mapContainerRef} style={{ width: "100%", height }} className="w-full h-full relative" />

        {!mapReady && !loadError && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <span className="text-xs font-semibold tracking-wide">Loading live map…</span>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center text-white z-20">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
            <h4 className="text-sm font-bold text-white">Google Maps could not load</h4>
            <p className="text-xs text-slate-300 max-w-sm mt-1">
              Check the Maps API key and its allowed domains.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs bg-slate-800 px-3 py-2 rounded-xl">
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

        {mapReady && !loadError && (
          <>
            {/* ETA pill, like the Google Maps route bubble */}
            <div className="absolute top-3 left-3 z-10 max-w-[55%]">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-lg text-[11px] font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
                <span className={`w-2 h-2 shrink-0 rounded-full ${riderActive ? "bg-emerald-500 animate-pulse" : "bg-blue-500"}`} />
                {timeline.totalMin !== null && !finished ? (
                  <span className="truncate">
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      {Math.max(1, Math.round(timeline.totalMin))} min
                    </span>
                    <span className="text-slate-500">
                      {" "}
                      · {routeMode === "to-pickup" ? "to pickup" : routeMode === "to-dropoff" ? "to drop-off" : "trip"}
                    </span>
                  </span>
                ) : (
                  <span className="uppercase tracking-wider truncate">{status.replace("_", " ")}</span>
                )}
              </div>
            </div>

            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              {riderActive && (
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
                onClick={handleCenter}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/10 shadow-lg text-xs font-medium transition flex items-center gap-1"
                title="Focus on rider / pickup"
              >
                <Navigation className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Center</span>
              </button>
              <button
                onClick={handleToggleMapType}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/10 shadow-lg text-xs font-medium transition flex items-center gap-1"
                title="Toggle roadmap / satellite"
              >
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline capitalize">{mapType}</span>
              </button>
            </div>

            {riderActive && (
              <div className="absolute bottom-3 left-3 z-10 bg-purple-950/90 backdrop-blur-md text-purple-100 border border-purple-800 px-3 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg max-w-[calc(100%-1.5rem)]">
                <Bike className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                <span className="truncate">{riderName || "Courier"}</span>
                {riderUpdatedAt && (
                  <span className="text-[10px] font-medium text-purple-300 shrink-0">• {formatRelativeTime(riderUpdatedAt)}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showTimeline && (
        <TripTimeline
          status={status}
          stops={timeline.stops}
          totalKm={timeline.totalKm}
          totalMin={timeline.totalMin}
          steps={timeline.steps}
          source={route?.result.source || null}
          loading={routeLoading}
        />
      )}
    </div>
  );
}
