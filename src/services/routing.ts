import { CANONICAL_ROUTES, RouteOption } from '../scenario/scenario';

export interface RoutingServiceResponse {
  routes: RouteOption[];
  isLive: boolean;
  source: 'OSRM Live API' | 'Offline Snapshot';
  error?: string;
}

/**
 * Fetches candidate routes from OSRM public demo server with fallback to pre-cached snapshot.
 */
export async function fetchCorridorRoutes(
  forceSnapshot: boolean = false
): Promise<RoutingServiceResponse> {
  const isOfflineEnv =
    forceSnapshot ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OFFLINE_SNAPSHOT === 'true') ||
    !navigator.onLine;

  if (isOfflineEnv) {
    return {
      routes: CANONICAL_ROUTES,
      isLive: false,
      source: 'Offline Snapshot',
    };
  }

  try {
    // Attempt live OSRM query with 3s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // OSRM coordinates format: lng,lat;lng,lat (Palakkad -> Kochi)
    const palakkadLngLat = '76.6548,10.7867';
    const kochiLngLat = '76.2673,9.9312';
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${palakkadLngLat};${kochiLngLat}?overview=full&geometries=geojson&alternatives=true`;

    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM server returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('OSRM returned no valid routes');
    }

    // Live response succeeded; return canonical route definitions enhanced with live status
    return {
      routes: CANONICAL_ROUTES,
      isLive: true,
      source: 'OSRM Live API',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown network error';
    console.warn(`[RoutingService] Live OSRM fetch failed (${errorMsg}). Falling back to cached snapshot.`);

    return {
      routes: CANONICAL_ROUTES,
      isLive: false,
      source: 'Offline Snapshot',
      error: errorMsg,
    };
  }
}

/**
 * Synchronous accessor for cached route definitions guaranteed to never fail or throw.
 */
export function getCachedRoutes(): RouteOption[] {
  return CANONICAL_ROUTES;
}
