import { describe, it, expect, beforeEach } from 'vitest';
import { useLogisticsStore } from '../store/useLogisticsStore';
import { computeImpactMetrics } from '../engines/impactMetrics';
import { classifyCargoText } from '../engines/cargoClassifier';
import { evaluateRoutes } from '../engines/routeEngine';
import { evaluateTripImpact } from '../engines/impactEngine';
import { CANONICAL_ROUTES, CANONICAL_PRIMARY_TRIP, CANONICAL_INCIDENT_1042 } from '../scenario/scenario';
import { fetchCorridorWeather } from '../services/weather';

describe('Phase 4 Acceptance & Full Journey E2E Tests', () => {
  beforeEach(() => {
    useLogisticsStore.getState().resetDemo();
  });

  // E1: Dynamic parameterization in Impact calculation
  it('E1: Editing spoilage rate or cargo value updates avoided spoilage and net savings live', () => {
    const defaultAssumptions = {
      cargoValueRs: 60000,
      spoilageRatePerHour: 0.12, // 12%
      fuelCostPerKmRs: 24.0,
      idleCostPerHourRs: 350.0,
      expectedQueueMinutes: 90,
    };

    const initialMetrics = computeImpactMetrics(defaultAssumptions, true);
    expect(initialMetrics.blockageWaitAvoidedMinutes).toBe(73); // 90 - 17 = 73
    expect(initialMetrics.spoilageCostAvoidedRs).toBe(8760);

    // Update spoilage rate to 20%
    const higherSpoilageAssumptions = {
      ...defaultAssumptions,
      spoilageRatePerHour: 0.20,
    };
    const updatedMetrics = computeImpactMetrics(higherSpoilageAssumptions, true);
    expect(updatedMetrics.spoilageCostAvoidedRs).toBe(14600);
    expect(updatedMetrics.netFinancialSavingsRs).toBeGreaterThan(initialMetrics.netFinancialSavingsRs);
  });

  // E2: Resilience with zero keys and snapshot fallback
  it('E2: System operates with zero keys using robust local classifiers and snapshots', () => {
    const classification = classifyCargoText('500 kg fresh tomatoes');
    expect(classification.sourceBadge).toBe('Rule-based template');
    expect(classification.category).toBe('PERISHABLE');
  });

  // E3: Comprehensive 12-Step Full Demo Journey E2E Test (Ran across 5 consecutive iterations)
  for (let iteration = 1; iteration <= 5; iteration++) {
    it(`E3: [Run ${iteration}/5] Complete 12-Step Canonical Logistics Demo Journey`, async () => {
      const store = useLogisticsStore.getState();
      store.resetDemo();

      // Step 1: Trip Created & Dispatched (09:00)
      expect(useLogisticsStore.getState().demoClock).toBe('09:00');
      expect(useLogisticsStore.getState().primaryTrip.activeRouteId).toBe('R1');
      expect(useLogisticsStore.getState().primaryTrip.status).toBe('IN_TRANSIT');

      // Step 2: Cargo Classified as PERISHABLE (Minimize Delay)
      const cargoResult = classifyCargoText('500 kg fresh vegetables, deliver by 12:00');
      expect(cargoResult.category).toBe('PERISHABLE');
      expect(cargoResult.primaryPriority).toContain('MINIMIZE DELAY');

      // Step 3: Route Comparison & Recommendation before incident
      const weather = await fetchCorridorWeather(true);
      const preEval = evaluateRoutes(
        CANONICAL_ROUTES,
        CANONICAL_PRIMARY_TRIP.cargo,
        CANONICAL_PRIMARY_TRIP.vehicle,
        weather.waypoints,
        []
      );
      expect(preEval.recommendedRoute.route.id).toBe('R1');
      expect(preEval.recommendedRoute.roleBadges).toContain('FASTEST');

      // Step 4: Advance to 10:10 (Authority Incident Logged on Server)
      useLogisticsStore.getState().setDemoStep(1);
      expect(useLogisticsStore.getState().demoClock).toBe('10:10');

      // Step 5: Advance to 10:17 (Incident Ingested & Impact Evaluated)
      useLogisticsStore.getState().setDemoStep(2);
      const stateAt1017 = useLogisticsStore.getState();
      expect(stateAt1017.demoClock).toBe('10:17');
      expect(stateAt1017.primaryTrip.status).toBe('CRITICAL');
      expect(stateAt1017.activeAlertTrip104).not.toBeNull();
      expect(stateAt1017.activeAlertTrip104?.distanceAheadKm).toBe(24.0);
      expect(stateAt1017.activeAlertTrip104?.timeToImpactMin).toBe(23);

      // Step 6: Verify secondary vehicle VH-208 unaffected
      const r2Route = CANONICAL_ROUTES.find((r) => r.id === 'R2')!;
      const vh208Impact = evaluateTripImpact(
        useLogisticsStore.getState().secondaryTrip,
        r2Route,
        CANONICAL_INCIDENT_1042,
        '10:17'
      );
      expect(vh208Impact.affectsTrip).toBe(false);
      expect(vh208Impact.suppressed).toBe(true);

      // Step 7: Re-scoring verifies R1 BLOCKED and R2 Recommended
      const postEval = evaluateRoutes(
        CANONICAL_ROUTES,
        CANONICAL_PRIMARY_TRIP.cargo,
        CANONICAL_PRIMARY_TRIP.vehicle,
        weather.waypoints,
        [CANONICAL_INCIDENT_1042]
      );
      expect(postEval.recommendedRoute.route.id).toBe('R2');

      // Step 8: Driver Arun accepts Reroute to R2 (10:19)
      useLogisticsStore.getState().setDemoStep(3);
      const stateAt1019 = useLogisticsStore.getState();
      expect(stateAt1019.demoClock).toBe('10:19');
      expect(stateAt1019.primaryTrip.status).toBe('REROUTED');
      expect(stateAt1019.primaryTrip.activeRouteId).toBe('R2');
      expect(stateAt1019.primaryTrip.currentEta).toBe('11:27');

      // Step 9: Cellular Network Drop near coastal stretch (10:30)
      useLogisticsStore.getState().setDemoStep(4);
      const stateAt1030 = useLogisticsStore.getState();
      expect(stateAt1030.isNetworkOnline).toBe(false);
      expect(stateAt1030.lastSyncTime).toBe('10:29');

      // Step 10: Cellular Network Restored & Synchronized (10:42)
      useLogisticsStore.getState().setDemoStep(5);
      await new Promise((r) => setTimeout(r, 1300));
      const stateAt1042 = useLogisticsStore.getState();
      expect(stateAt1042.isNetworkOnline).toBe(true);
      expect(stateAt1042.lastSyncTime).toBe('10:42');

      // Step 11: Impact Analytics verification
      const metrics = computeImpactMetrics(stateAt1042.assumptions, true);
      expect(metrics.blockageWaitAvoidedMinutes).toBe(73);
      expect(metrics.spoilageCostAvoidedRs).toBeGreaterThan(0);
      expect(metrics.netFinancialSavingsRs).toBeGreaterThan(0);

      // Step 12: Instant Reset restoring canonical starting state
      useLogisticsStore.getState().resetDemo();
      const resetState = useLogisticsStore.getState();
      expect(resetState.demoClock).toBe('09:00');
      expect(resetState.primaryTrip.status).toBe('IN_TRANSIT');
      expect(resetState.primaryTrip.activeRouteId).toBe('R1');
      expect(resetState.activeAlertTrip104).toBeNull();
    });
  }
});
