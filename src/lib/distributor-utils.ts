import type { Distributor } from "./types";

const EARTH_RADIUS_KM = 6371;

export function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function pointInDistributorCoverage(
  point: { lat: number; lng: number },
  dist: Distributor,
): boolean {
  if (dist.coverageMode === "radius") {
    const distKm = haversineDistance(point, {
      lat: dist.latitude,
      lng: dist.longitude,
    });
    return distKm <= dist.coverageRadiusKm;
  }
  return false;
}

export function cityMatchesDistributor(
  cityName: string,
  dist: Distributor,
): boolean {
  if (dist.coverageMode !== "city") return false;
  const normalized = cityName.trim().toLowerCase();
  return dist.coverageCities.some(
    (c) => c.trim().toLowerCase() === normalized,
  );
}

export function findDistributorForPoint(
  point: { lat: number; lng: number },
  distributors: Distributor[],
  cityName?: string,
): Distributor | null {
  if (cityName) {
    for (const dist of distributors) {
      if (!dist.active) continue;
      if (cityMatchesDistributor(cityName, dist)) {
        return dist;
      }
    }
  }
  for (const dist of distributors) {
    if (!dist.active) continue;
    if (pointInDistributorCoverage(point, dist)) {
      return dist;
    }
  }
  return null;
}

export function findDistributorForCity(
  cityName: string,
  distributors: Distributor[],
): Distributor | null {
  for (const dist of distributors) {
    if (!dist.active) continue;
    if (cityMatchesDistributor(cityName, dist)) {
      return dist;
    }
  }
  return null;
}
