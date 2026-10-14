// Google Maps Client Utility & Script Loader for LogiPulse
import { GeoLocation } from "@/types";

export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.REACT_APP_GOOGLE_MAP_KEY ||
  "AIzaSyBleBgqr4FOUyij7NH2aoVbPtMNK9am0f8";

export const KARACHI_DEFAULT_CENTER = {
  lat: 24.8607,
  lng: 67.0011,
};

export const KARACHI_BOUNDS = {
  north: 25.30,
  south: 24.70,
  east: 67.50,
  west: 66.75,
};

/**
 * Validates strictly whether coordinates fall inside the Karachi, Pakistan metropolitan area
 */
export function isWithinKarachi(lat: number, lng: number): boolean {
  return (
    lat >= KARACHI_BOUNDS.south &&
    lat <= KARACHI_BOUNDS.north &&
    lng >= KARACHI_BOUNDS.west &&
    lng <= KARACHI_BOUNDS.east
  );
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

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if already in DOM
    const existingScript = document.getElementById("logipulse-google-maps");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google?.maps) resolve(window.google.maps);
        else reject(new Error("Google Maps loaded without maps namespace."));
      });
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.id = "logipulse-google-maps";
    script.type = "text/javascript";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps API script loaded but window.google.maps is undefined."));
      }
    };

    script.onerror = (err) => {
      googleMapsPromise = null;
      console.warn("Google Maps script failed to load:", err);
      reject(err);
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

/**
 * Clean modern dark map styles for sleek nighttime dashboard experience
 */
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#13233b" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1d4ed8" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
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
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0284c7" flood-opacity="0.4"/>
          </filter>
        </defs>
        <path d="M19 0C8.5 0 0 8.5 0 19C0 31.5 19 48 19 48S38 31.5 38 19C38 8.5 29.5 0 19 0Z" fill="#0284c7" filter="url(#shadow)"/>
        <circle cx="19" cy="18" r="9" fill="#ffffff"/>
        <circle cx="19" cy="18" r="5" fill="#0284c7"/>
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
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#059669" flood-opacity="0.4"/>
          </filter>
        </defs>
        <path d="M19 0C8.5 0 0 8.5 0 19C0 31.5 19 48 19 48S38 31.5 38 19C38 8.5 29.5 0 19 0Z" fill="#059669" filter="url(#shadow)"/>
        <circle cx="19" cy="18" r="9" fill="#ffffff"/>
        <path d="M15 18L18 21L23 15" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
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
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#7c3aed" flood-opacity="0.5"/>
        </filter>
      </defs>
      <circle cx="24" cy="24" r="22" fill="#7c3aed" filter="url(#glow)"/>
      <circle cx="24" cy="24" r="18" fill="#ffffff"/>
      <!-- Bike Icon -->
      <g transform="translate(10, 10) scale(0.6)" stroke="#7c3aed" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">
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
