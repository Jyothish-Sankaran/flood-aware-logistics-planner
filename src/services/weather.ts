import weatherSnapshot from '../data/snapshots/weather.json';

export interface WaypointWeather {
  location: string;
  lat: number;
  lng: number;
  precipitationMm: number;
  precipitationProbability: number;
  condition: string;
  windSpeedKmh: number;
  temperatureC: number;
}

export interface WeatherServiceResponse {
  waypoints: WaypointWeather[];
  isLive: boolean;
  source: 'Open-Meteo Live API' | 'Offline Snapshot';
  error?: string;
}

/**
 * Fetches real-time weather from Open-Meteo API with fallback to pre-cached snapshot.
 */
export async function fetchCorridorWeather(
  forceSnapshot: boolean = false
): Promise<WeatherServiceResponse> {
  const isOfflineEnv =
    forceSnapshot ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OFFLINE_SNAPSHOT === 'true') ||
    !navigator.onLine;

  if (isOfflineEnv) {
    return {
      waypoints: weatherSnapshot.waypoints as WaypointWeather[],
      isLive: false,
      source: 'Offline Snapshot',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Query weather for Angamaly / Central Corridor (Lat 10.1960, Lng 76.3860)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=10.196&longitude=76.386&current=temperature_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability`;

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    const currentPrecip = data.current?.precipitation ?? 18.0;
    const currentTemp = data.current?.temperature_2m ?? 26.0;
    const currentWind = data.current?.wind_speed_10m ?? 25.0;
    const precipProb = data.hourly?.precipitation_probability?.[0] ?? 80;

    // Enhance waypoint list with current atmospheric data
    const waypoints: WaypointWeather[] = weatherSnapshot.waypoints.map((wp) => ({
      ...wp,
      precipitationMm: wp.location === 'Angamaly' || wp.location === 'Chalakudy' ? currentPrecip : wp.precipitationMm,
      precipitationProbability: precipProb,
      temperatureC: currentTemp,
      windSpeedKmh: currentWind,
    }));

    return {
      waypoints,
      isLive: true,
      source: 'Open-Meteo Live API',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown weather network error';
    console.warn(`[WeatherService] Open-Meteo fetch failed (${errorMsg}). Falling back to cached snapshot.`);

    return {
      waypoints: weatherSnapshot.waypoints as WaypointWeather[],
      isLive: false,
      source: 'Offline Snapshot',
      error: errorMsg,
    };
  }
}
