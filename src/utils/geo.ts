// High-precision geographic calculations for route analysis and impact evaluation

export type LatLngTuple = [number, number]; // [lat, lng]

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function haversineDistanceKm(coord1: LatLngTuple, coord2: LatLngTuple): number {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371.0; // Earth's radius in km

  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates Haversine distance between two coordinates in meters.
 */
export function haversineDistanceMeters(coord1: LatLngTuple, coord2: LatLngTuple): number {
  return haversineDistanceKm(coord1, coord2) * 1000;
}

/**
 * Calculates perpendicular distance from a point P to a line segment AB in meters.
 */
export function distancePointToSegmentMeters(
  point: LatLngTuple,
  segA: LatLngTuple,
  segB: LatLngTuple
): number {
  const [pLat, pLng] = point;
  const [aLat, aLng] = segA;
  const [bLat, bLng] = segB;

  // Approximate flat-earth projection for local Kerala distances
  const cosLat = Math.cos(((aLat + bLat) / 2 * Math.PI) / 180);
  const px = (pLng - aLng) * cosLat;
  const py = pLat - aLat;
  const bx = (bLng - aLng) * cosLat;
  const by = bLat - aLat;

  const segLengthSq = bx * bx + by * by;

  if (segLengthSq === 0) {
    return haversineDistanceMeters(point, segA);
  }

  // Projection parameter t
  let t = (px * bx + py * by) / segLengthSq;
  t = Math.max(0, Math.min(1, t));

  const projLat = aLat + t * (bLat - aLat);
  const projLng = aLng + t * (bLng - aLng);

  return haversineDistanceMeters(point, [projLat, projLng]);
}

/**
 * Returns the minimum distance in meters from a point to a polyline.
 */
export function getDistanceToPolylineMeters(point: LatLngTuple, polyline: LatLngTuple[]): number {
  if (polyline.length === 0) return Infinity;
  if (polyline.length === 1) return haversineDistanceMeters(point, polyline[0]);

  let minDistance = Infinity;

  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distancePointToSegmentMeters(point, polyline[i], polyline[i + 1]);
    if (d < minDistance) {
      minDistance = d;
    }
  }

  return minDistance;
}

/**
 * Checks if a point lies on the route within a given threshold (default 500 meters).
 */
export function isPointOnRoute(
  point: LatLngTuple,
  polyline: LatLngTuple[],
  thresholdMeters: number = 500
): boolean {
  return getDistanceToPolylineMeters(point, polyline) <= thresholdMeters;
}

/**
 * Finds the closest index on the polyline for a given coordinate.
 */
export function findClosestPolylineIndex(point: LatLngTuple, polyline: LatLngTuple[]): number {
  let closestIndex = 0;
  let minDistance = Infinity;

  for (let i = 0; i < polyline.length; i++) {
    const d = haversineDistanceKm(point, polyline[i]);
    if (d < minDistance) {
      minDistance = d;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Computes distance along the route ahead of the vehicle to an incident.
 * Returns -1 if incident is behind the vehicle or not on route.
 */
export function computeDistanceAheadKm(
  truckPos: LatLngTuple,
  incidentPos: LatLngTuple,
  polyline: LatLngTuple[]
): number {
  const truckIdx = findClosestPolylineIndex(truckPos, polyline);
  const incidentIdx = findClosestPolylineIndex(incidentPos, polyline);

  if (incidentIdx < truckIdx) {
    // Incident is behind the truck
    return -1;
  }

  // Sum distances along segments from truck to incident
  let distanceKm = 0;
  // Distance from truck to next waypoint
  distanceKm += haversineDistanceKm(truckPos, polyline[truckIdx]);

  for (let i = truckIdx; i < incidentIdx; i++) {
    distanceKm += haversineDistanceKm(polyline[i], polyline[i + 1]);
  }

  return Math.round(distanceKm * 10) / 10;
}
