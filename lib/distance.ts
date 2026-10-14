/**
 * Calculates geographical distance in kilometers between two latitude/longitude points
 * using the Haversine formula.
 */
export function calculateDistance(
  riderLatitude: number,
  riderLongitude: number,
  pickupLatitude: number,
  pickupLongitude: number
): number {
  if (
    isNaN(riderLatitude) ||
    isNaN(riderLongitude) ||
    isNaN(pickupLatitude) ||
    isNaN(pickupLongitude)
  ) {
    return 0;
  }

  const EARTH_RADIUS_KM = 6371; // Earth's mean radius in km

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(pickupLatitude - riderLatitude);
  const dLon = toRadians(pickupLongitude - riderLongitude);

  const lat1Rad = toRadians(riderLatitude);
  const lat2Rad = toRadians(pickupLatitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceKm = EARTH_RADIUS_KM * c;
  return Number(distanceKm.toFixed(2));
}

/**
 * Format distance in a human-readable string (e.g. "1.4 km" or "850 m")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Estimated travel time in minutes based on urban Karachi courier speeds (~25 km/h avg)
 */
export function estimateTravelTimeMinutes(km: number): number {
  const averageSpeedKmH = 24;
  const bufferMinutes = 5; // traffic buffer
  const minutes = Math.round((km / averageSpeedKmH) * 60) + bufferMinutes;
  return Math.max(5, minutes);
}
