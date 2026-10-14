// Google Maps Client Utility & Script Loader for LogiPulse
import { GeoLocation } from "@/types";

export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.REACT_APP_GOOGLE_MAP_KEY ||
  "AIzaSyBleBgqr4FOUyij7NH2aoVbPtMNK9am0f8";

// Geographic centre of Pakistan, used when there is no better point to focus on
export const PAKISTAN_DEFAULT_CENTER = {
  lat: 30.3753,
  lng: 69.3451,
};

export const PAKISTAN_DEFAULT_ZOOM = 5;

// Bounding box covering all of Pakistan (incl. Gilgit-Baltistan and AJK)
export const PAKISTAN_BOUNDS = {
  north: 37.1,
  south: 23.6,
  east: 77.9,
  west: 60.8,
};

/**
 * Checks whether coordinates fall inside Pakistan's bounding box
 */
export function isWithinPakistan(lat: number, lng: number): boolean {
  return (
    lat >= PAKISTAN_BOUNDS.south &&
    lat <= PAKISTAN_BOUNDS.north &&
    lng >= PAKISTAN_BOUNDS.west &&
    lng <= PAKISTAN_BOUNDS.east
  );
}

/**
 * Escapes user-provided text before it is placed inside InfoWindow HTML
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Calculates real driving distance and duration between two coordinates using Google Maps Distance Matrix
 */
export async function getGoogleDrivingDistance(
  origin: GeoLocation,
  destination: GeoLocation
): Promise<{ distanceKm: number; durationText: string } | null> {
  try {
    const googleMaps = await loadGoogleMaps();
    return new Promise((resolve) => {
      const service = new googleMaps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [{ lat: origin.latitude, lng: origin.longitude }],
          destinations: [{ lat: destination.latitude, lng: destination.longitude }],
          travelMode: googleMaps.TravelMode.DRIVING,
          unitSystem: googleMaps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (
            status === "OK" &&
            response?.rows?.[0]?.elements?.[0]?.status === "OK"
          ) {
            const element = response.rows[0].elements[0];
            const distanceKm = Math.round((element.distance.value / 1000) * 10) / 10;
            const durationText = element.duration.text;
            resolve({ distanceKm, durationText });
          } else {
            resolve(null);
          }
        }
      );
    });
  } catch (err) {
    console.warn("Google Distance Matrix calculation notice:", err);
    return null;
  }
}

let googleMapsPromise: Promise<typeof google.maps> | null = null;

/**
 * Dynamically and reliably loads the Google Maps JavaScript SDK
 * Includes Places and Geometry libraries for autocomplete and distance calculations.
 */
export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only be loaded in browser."));
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = waitForBootstrap()
    .then(async () => {
      // With `loading=async` the script only installs a bootstrap; classes such as Map, Marker,
      // DistanceMatrixService, DirectionsService and Autocomplete exist only after their
      // library is imported. Importing them also populates the classic google.maps.* namespace.
      await Promise.all(MAPS_LIBRARIES.map((lib) => window.google.maps.importLibrary(lib)));
      return window.google.maps;
    })
    .catch((err) => {
      googleMapsPromise = null;
      console.warn("Google Maps failed to load:", err);
      throw err;
    });

  return googleMapsPromise;
}

// "routes" provides DirectionsService and DistanceMatrixService
const MAPS_LIBRARIES = ["core", "maps", "marker", "places", "geometry", "routes", "geocoding"];

/** Injects the Maps script once and resolves when google.maps.importLibrary is available. */
function waitForBootstrap(): Promise<void> {
  if (typeof window.google?.maps?.importLibrary === "function") {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const callbackName = "__logipulseMapsReady";
    (window as any)[callbackName] = () => resolve();

    // Script already injected (e.g. after hot reload): wait for its callback or for importLibrary to appear
    const existing = document.getElementById("logipulse-google-maps");
    if (existing) {
      const started = Date.now();
      const poll = setInterval(() => {
        if (typeof window.google?.maps?.importLibrary === "function") {
          clearInterval(poll);
          resolve();
        } else if (Date.now() - started > 15000) {
          clearInterval(poll);
          reject(new Error("Timed out waiting for Google Maps."));
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = "logipulse-google-maps";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      script.remove();
      reject(new Error("Google Maps script failed to load. Check the API key and network."));
    };
    document.head.appendChild(script);
  });
}

/**
 * Clean modern dark map styles for sleek nighttime dashboard experience
 */
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#15152A" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#15152A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9696AE" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6B6B85" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1B1B33" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#23233A" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#383850" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1d4ed8" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#23233A" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#082f49" }],
  },
];

/**
 * High contrast light map styles for clean daytime view
 */
export const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#0284c7" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e2e8f0" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#93c5fd" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#bae6fd" }],
  },
];

/**
 * Creates custom SVG map marker icons for Pickup, Delivery and Rider
 */
export function createMapIcon(type: "pickup" | "delivery" | "rider"): google.maps.Icon | undefined {
  if (typeof window === "undefined" || !window.google?.maps) return undefined;

  if (type === "pickup") {
    // Vibrant Blue Pickup Pin
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#039855" flood-opacity="0.4"/>
          </filter>
        </defs>
        <path d="M19 0C8.5 0 0 8.5 0 19C0 31.5 19 48 19 48S38 31.5 38 19C38 8.5 29.5 0 19 0Z" fill="#039855" filter="url(#shadow)"/>
        <circle cx="19" cy="18" r="9" fill="#ffffff"/>
        <circle cx="19" cy="18" r="5" fill="#039855"/>
      </svg>
    `;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(38, 48),
      anchor: new google.maps.Point(19, 48),
    };
  }

  if (type === "delivery") {
    // Vibrant Emerald / Teal Destination Pin
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#F97316" flood-opacity="0.4"/>
          </filter>
        </defs>
        <path d="M19 0C8.5 0 0 8.5 0 19C0 31.5 19 48 19 48S38 31.5 38 19C38 8.5 29.5 0 19 0Z" fill="#F97316" filter="url(#shadow)"/>
        <circle cx="19" cy="18" r="9" fill="#ffffff"/>
        <path d="M15 18L18 21L23 15" stroke="#F97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    `;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(38, 48),
      anchor: new google.maps.Point(19, 48),
    };
  }

  // Live Moving Rider Icon (Bike with glowing purple / amber badge)
  const riderSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <defs>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#12B76A" flood-opacity="0.5"/>
        </filter>
      </defs>
      <circle cx="24" cy="24" r="22" fill="#12B76A" filter="url(#glow)"/>
      <circle cx="24" cy="24" r="18" fill="#ffffff"/>
      <!-- Bike Icon -->
      <g transform="translate(10, 10) scale(0.6)" stroke="#12B76A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <circle cx="5.5" cy="17.5" r="3.5" fill="none"/>
        <circle cx="18.5" cy="17.5" r="3.5" fill="none"/>
        <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 9l3-2h3l2 4"/>
        <path d="M12 17.5h-4"/>
      </g>
    </svg>
  `;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(riderSvg)}`,
    scaledSize: new google.maps.Size(48, 48),
    anchor: new google.maps.Point(24, 24),
  };
}
