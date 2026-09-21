// Haversine formula for agricultural logistics distance & ETA calculation
// KRISHIFLOW-AI - Smart India Hackathon 2026

export interface LatLng {
  latitude: number;
  longitude: number;
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export function calculateEtaMinutes(distanceKm: number, averageSpeedKmh: number = 32): number {
  if (distanceKm <= 0) return 3;
  return Math.max(5, Math.round((distanceKm / averageSpeedKmh) * 60));
}

export function findNearestEligibleVehicle<T extends { latitude: number; longitude: number; capacity_kg: number; status: string }>(
  pickupLat: number,
  pickupLon: number,
  cropQuantityKg: number,
  vehicles: T[]
): (T & { distance_km: number; eta_minutes: number }) | null {
  const eligible = vehicles.filter(
    (v) => v.capacity_kg >= cropQuantityKg && v.status === 'available'
  );

  if (eligible.length === 0) {
    // If none strictly available, pick nearest on_trip or available for fallback
    const allMatchingCapacity = vehicles.filter((v) => v.capacity_kg >= cropQuantityKg);
    if (allMatchingCapacity.length === 0) return null;
    const scoredFallback = allMatchingCapacity.map((v) => {
      const dist = calculateDistanceKm(pickupLat, pickupLon, v.latitude, v.longitude);
      return {
        ...v,
        distance_km: dist,
        eta_minutes: calculateEtaMinutes(dist),
      };
    });
    scoredFallback.sort((a, b) => a.distance_km - b.distance_km);
    return scoredFallback[0];
  }

  const scored = eligible.map((v) => {
    const dist = calculateDistanceKm(pickupLat, pickupLon, v.latitude, v.longitude);
    return {
      ...v,
      distance_km: dist,
      eta_minutes: calculateEtaMinutes(dist),
    };
  });

  scored.sort((a, b) => a.distance_km - b.distance_km);
  return scored[0];
}
