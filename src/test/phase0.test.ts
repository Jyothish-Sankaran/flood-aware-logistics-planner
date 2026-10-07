import { describe, it, expect } from 'vitest';
import { CANONICAL_ROUTES, CANONICAL_COORDINATES } from '../scenario/scenario';
import { fetchCorridorRoutes } from '../services/routing';
import { fetchCorridorWeather } from '../services/weather';
import { isPointOnRoute, getDistanceToPolylineMeters } from '../utils/geo';
import floodZonesGeoJson from '../data/floodZones.geojson';

describe('Phase 0 Acceptance Tests: Foundation, Scenario & Real Map', () => {
  // A1: Loads with no keys and no internet, returns 3 canonical routes
  it('A1: Successfully loads 3 candidate routes in offline/zero-key snapshot mode', async () => {
    const res = await fetchCorridorRoutes(true);
    expect(res.routes).toBeDefined();
    expect(res.routes.length).toBe(3);
    expect(res.source).toBe('Offline Snapshot');

    const routeIds = res.routes.map((r) => r.id);
    expect(routeIds).toEqual(['R1', 'R2', 'R3']);
  });

  // A2: Distances/durations match scenario.ts exactly
  it('A2: Distances and durations match canonical scenario specifications', () => {
    const r1 = CANONICAL_ROUTES.find((r) => r.id === 'R1')!;
    const r2 = CANONICAL_ROUTES.find((r) => r.id === 'R2')!;
    const r3 = CANONICAL_ROUTES.find((r) => r.id === 'R3')!;

    expect(r1.distanceKm).toBe(138.0);
    expect(r1.durationMinutes).toBe(130);
    expect(r1.eta).toBe('11:10');

    expect(r2.distanceKm).toBe(152.0);
    expect(r2.durationMinutes).toBe(147);
    expect(r2.eta).toBe('11:27');

    // Canonical +17 min gap between R1 and R2
    expect(r2.durationMinutes - r1.durationMinutes).toBe(17);

    expect(r3.distanceKm).toBe(165.0);
    expect(r3.durationMinutes).toBe(161);
    expect(r3.eta).toBe('11:41');
  });

  // A3: Angamaly lies on R1 (<500m) and NOT on R2 (>500m)
  it('A3: Angamaly incident coordinates lie on R1 (<500m) and strictly NOT on R2', () => {
    const angamalyCoords: [number, number] = [10.1960, 76.3860];
    const r1Coords = CANONICAL_COORDINATES.R1;
    const r2Coords = CANONICAL_COORDINATES.R2;

    const distToR1 = getDistanceToPolylineMeters(angamalyCoords, r1Coords);
    const distToR2 = getDistanceToPolylineMeters(angamalyCoords, r2Coords);

    expect(distToR1).toBeLessThan(500);
    expect(isPointOnRoute(angamalyCoords, r1Coords, 500)).toBe(true);

    // R2 bypass goes via Mala / Paravur, which is kilometers away from Angamaly
    expect(distToR2).toBeGreaterThan(1500);
    expect(isPointOnRoute(angamalyCoords, r2Coords, 500)).toBe(false);
  });

  // A4: Flood layer carries the explicit static layer disclaimer
  it('A4: Flood layer contains 8 curated Kerala zones with static disclaimer', () => {
    expect(floodZonesGeoJson.features.length).toBe(8);
    expect(floodZonesGeoJson.metadata.isStatic).toBe(true);
    expect(floodZonesGeoJson.metadata.disclaimer).toContain(
      'Historical flood-prone zones (illustrative, curated from 2018/2019 flood records), static layer'
    );
  });

  // A5: Data Status service returns valid snapshot and weather metadata
  it('A5: Weather service returns 6 Kerala corridor waypoints in snapshot mode', async () => {
    const res = await fetchCorridorWeather(true);
    expect(res.waypoints.length).toBe(6);
    expect(res.source).toBe('Offline Snapshot');

    const locations = res.waypoints.map((w) => w.location);
    expect(locations).toContain('Palakkad');
    expect(locations).toContain('Thrissur');
    expect(locations).toContain('Chalakudy');
    expect(locations).toContain('Angamaly');
    expect(locations).toContain('Aluva');
    expect(locations).toContain('Kochi');
  });
});
