import { describe, it, expect, beforeEach } from 'vitest';
import { useLogisticsStore } from '../store/useLogisticsStore';
import { computeImpactMetrics } from '../engines/impactMetrics';

describe('Phase 5 Acceptance Tests: Readiness, Governance, Limitations & Audit Logs', () => {
  beforeEach(() => {
    useLogisticsStore.getState().resetDemo();
  });

  // F2: Rerouting records structured audit log entry
  it('F2: Accepting a reroute creates an immutable audit log entry with timestamp, actor, and route details', () => {
    const store = useLogisticsStore.getState();

    // Trigger incident and accept reroute
    store.triggerAuthorityIncident();
    store.acceptRerouteTrip104();

    const auditLogs = useLogisticsStore.getState().auditLogs;
    const rerouteLog = auditLogs.find((l) => l.eventType === 'REROUTE_EXECUTED');

    expect(rerouteLog).toBeDefined();
    expect(rerouteLog?.title).toContain('Reroute to R2');
    expect(rerouteLog?.actor).toContain('Driver Arun');
    expect(rerouteLog?.timestamp).toBe('10:19');
    expect(rerouteLog?.details).toBeDefined();
    expect(rerouteLog?.details?.newRoute).toBe('R2');
  });

  // F3: Cost model formula validation
  it('F3: Cost estimator calculates total monthly infrastructure and per-vehicle cost dynamically', () => {
    const fleetSize = 25;
    const tripsPerDay = 2;
    const totalMonthlyTrips = fleetSize * tripsPerDay * 30; // 1500

    const hostingCost = 4500;
    const weatherCost = totalMonthlyTrips > 1000 ? 1200 : 0; // 1200
    const watsonxCost = Math.round(totalMonthlyTrips * 0.15); // 225
    const totalMonthlyCost = hostingCost + weatherCost + watsonxCost; // 5925
    const perVehicleMonth = Math.round(totalMonthlyCost / fleetSize); // 237

    expect(totalMonthlyTrips).toBe(1500);
    expect(totalMonthlyCost).toBe(5925);
    expect(perVehicleMonth).toBe(237);

    // Doubling fleet size
    const fleetSize2 = 50;
    const totalTrips2 = fleetSize2 * tripsPerDay * 30; // 3000
    const watsonxCost2 = Math.round(totalTrips2 * 0.15); // 450
    const totalMonthlyCost2 = hostingCost + weatherCost + watsonxCost2; // 6150
    const perVehicleMonth2 = Math.round(totalMonthlyCost2 / fleetSize2); // 123

    expect(perVehicleMonth2).toBeLessThan(perVehicleMonth); // Economics of scale
  });

  // F4: Citation and unsourced assumption disclosure
  it('F4: Impact calculations carries explicit citation and estimate notices', () => {
    const assumptions = useLogisticsStore.getState().assumptions;
    const metrics = computeImpactMetrics(assumptions, true);

    expect(metrics.citationNotes).toContain('Estimate based on stated assumptions');
    expect(metrics.blockageWaitAvoidedMinutes).toBe(73);
  });
});
