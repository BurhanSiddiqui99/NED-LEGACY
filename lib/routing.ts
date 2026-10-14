import { GeoLocation } from "@/types";
import { loadGoogleMaps } from "@/lib/google-maps";
import { calculateDistance, estimateTravelTimeMinutes } from "@/lib/distance";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteStep {
  instruction: string;
  distanceKm: number;
}

export interface RouteLeg {
  distanceKm: number;
  durationMin: number;
  steps: RouteStep[];
  // Index in RouteResult.path where this leg ends
  endIndex: number;
}

export interface RouteResult {
  path: LatLng[];
  legs: RouteLeg[];
  source: "google" | "osrm" | "straight";
}

const cache = new Map<string, Promise<RouteResult>>();

function cacheKey(points: GeoLocation[]): string {
  // ~10 m precision: tiny GPS jitter reuses the cached route
  return points.map((p) => `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`).join("|");
}

function stripHtml(html: string): string {
  if (typeof window === "undefined") return html.replace(/<[^>]+>/g, " ");
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

function nearestIndex(path: LatLng[], target: GeoLocation, from = 0): number {
  let best = from;
  let bestDist = Infinity;
  for (let i = from; i < path.length; i++) {
    const d = calculateDistance(path[i].lat, path[i].lng, target.latitude, target.longitude);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

async function googleRoute(points: GeoLocation[]): Promise<RouteResult> {
  const gm = await loadGoogleMaps();
  const service = new gm.DirectionsService();
  const toLatLng = (p: GeoLocation) => ({ lat: p.latitude, lng: p.longitude });

  const res = await service.route({
    origin: toLatLng(points[0]),
    destination: toLatLng(points[points.length - 1]),
    waypoints: points.slice(1, -1).map((p) => ({ location: toLatLng(p), stopover: true })),
    travelMode: gm.TravelMode.DRIVING,
    provideRouteAlternatives: false,
  });

  const route = res.routes[0];
  if (!route) throw new Error("No Google route");

  // Build a detailed path leg by leg so each leg's end index is known
  const path: LatLng[] = [];
  const legs: RouteLeg[] = route.legs.map((leg) => {
    leg.steps.forEach((step) => step.path.forEach((p) => path.push({ lat: p.lat(), lng: p.lng() })));
    return {
      distanceKm: (leg.distance?.value || 0) / 1000,
      durationMin: Math.round((leg.duration?.value || 0) / 60),
      steps: leg.steps.map((s) => ({
        instruction: stripHtml(s.instructions || ""),
        distanceKm: (s.distance?.value || 0) / 1000,
      })),
      endIndex: path.length - 1,
    };
  });

  return { path, legs, source: "google" };
}

function osrmInstruction(step: any): string {
  const m = step.maneuver || {};
  const road = step.name ? ` onto ${step.name}` : "";
  switch (m.type) {
    case "depart":
      return `Head ${m.modifier || "out"}${step.name ? ` on ${step.name}` : ""}`;
    case "arrive":
      return "Arrive at the stop";
    case "roundabout":
    case "rotary":
      return `At the roundabout, take exit ${m.exit || ""}${road}`.trim();
    case "merge":
      return `Merge${road}`;
    case "fork":
      return `Keep ${m.modifier || "ahead"} at the fork${road}`;
    case "end of road":
      return `Turn ${m.modifier || ""} at the end of the road${road}`;
    case "continue":
    case "new name":
      return `Continue${step.name ? ` on ${step.name}` : " straight"}`;
    default:
      return `${m.modifier ? `Turn ${m.modifier}` : "Continue"}${road}`;
  }
}

async function osrmRoute(points: GeoLocation[]): Promise<RouteResult> {
  const coords = points.map((p) => `${p.longitude},${p.latitude}`).join(";");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`,
      { signal: ctrl.signal }
    );
    const json = await res.json();
    const route = json?.routes?.[0];
    if (json.code !== "Ok" || !route) throw new Error("No OSRM route");

    const path: LatLng[] = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
    let searchFrom = 0;
    const legs: RouteLeg[] = route.legs.map((leg: any, i: number) => {
      const legEnd = points[i + 1];
      const endIndex = nearestIndex(path, legEnd, searchFrom);
      searchFrom = endIndex;
      return {
        distanceKm: leg.distance / 1000,
        durationMin: Math.round(leg.duration / 60),
        steps: (leg.steps || [])
          .filter((s: any) => s.distance > 0 || s.maneuver?.type === "arrive")
          .map((s: any) => ({ instruction: osrmInstruction(s), distanceKm: s.distance / 1000 })),
        endIndex,
      };
    });
    return { path, legs, source: "osrm" };
  } finally {
    clearTimeout(timer);
  }
}

function straightRoute(points: GeoLocation[]): RouteResult {
  const path = points.map((p) => ({ lat: p.latitude, lng: p.longitude }));
  const legs = points.slice(1).map((p, i) => {
    const km = calculateDistance(points[i].latitude, points[i].longitude, p.latitude, p.longitude);
    return { distanceKm: km, durationMin: estimateTravelTimeMinutes(km), steps: [], endIndex: i + 1 };
  });
  return { path, legs, source: "straight" };
}

/**
 * Road route through the given stops. Tries Google Directions first, then the public OSRM
 * router (OpenStreetMap), then falls back to straight lines with Haversine estimates.
 */
export function getRoadRoute(points: GeoLocation[]): Promise<RouteResult> {
  const key = cacheKey(points);
  const cached = cache.get(key);
  if (cached) return cached;

  const promise = googleRoute(points)
    .catch(() => osrmRoute(points))
    .catch(() => straightRoute(points));

  cache.set(key, promise);
  if (cache.size > 50) cache.delete(cache.keys().next().value as string);
  return promise;
}

/** Length of a path in km. */
export function pathLengthKm(path: LatLng[], from = 0, to = path.length - 1): number {
  let km = 0;
  for (let i = from; i < to; i++) {
    km += calculateDistance(path[i].lat, path[i].lng, path[i + 1].lat, path[i + 1].lng);
  }
  return km;
}

/** Index of the path vertex nearest to a position, plus how far off the path the position is. */
export function locateOnPath(path: LatLng[], pos: GeoLocation): { index: number; offRouteKm: number } {
  const index = nearestIndex(path, pos);
  const p = path[index];
  return { index, offRouteKm: p ? calculateDistance(p.lat, p.lng, pos.latitude, pos.longitude) : Infinity };
}

/** Point reached after travelling `km` along the path from its start. */
export function pointAlongPath(path: LatLng[], km: number): LatLng {
  let remaining = km;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = calculateDistance(path[i].lat, path[i].lng, path[i + 1].lat, path[i + 1].lng);
    if (seg >= remaining && seg > 0) {
      const f = remaining / seg;
      return {
        lat: path[i].lat + (path[i + 1].lat - path[i].lat) * f,
        lng: path[i].lng + (path[i + 1].lng - path[i].lng) * f,
      };
    }
    remaining -= seg;
  }
  return path[path.length - 1];
}
