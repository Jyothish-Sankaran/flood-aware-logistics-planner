import { describe, it, expect, beforeEach } from 'vitest';
import { useLogisticsStore } from '../store/useLogisticsStore';

describe('Phase 3 Acceptance Tests: Driver App, Hazard Reporting, Offline Mode & Emergency', () => {
  beforeEach(() => {
    useLogisticsStore.getState().resetDemo();
  });

  // D1: GPS movement updating coordinates along route geometry
  it('D1: Updating GPS position advances vehicle coordinates and progress percent', () => {
    const store = useLogisticsStore.getState();
    const newPos: [number, number] = [10.4500, 76.2700]; // Puthukkad

    store.updateGpsPosition(newPos, 35);

    const updatedTrip = useLogisticsStore.getState().primaryTrip;
    expect(updatedTrip.currentPosition).toEqual(newPos);
    expect(updatedTrip.currentProgressPercent).toBe(35);
  });

  // D2: Hazard report creates an incident through the pipeline
  it('D2: Driver hazard report creates an unverified incident with correct telemetry metadata', () => {
    const store = useLogisticsStore.getState();
    const initialCount = store.incidents.length;

    store.addIncident({
      id: 'INC-1045',
      type: 'FALLEN_TREE',
      typeLabel: 'Fallen Tree',
      locationName: 'Near Chalakudy Embankment',
      coordinates: [10.3070, 76.3330],
      timestamp: '10:20',
      severity: 'HIGH',
      source: 'DRIVER_REPORT',
      sourceLabel: 'Driver Report (Arun / VH-104)',
      sourceDriverId: 'DRV-ARUN',
      verificationStatus: 'UNVERIFIED',
      confidence: 'LOW',
      confidenceScore: 0.45,
      description: 'Maram veenu road block',
      affectedRouteIds: ['R1'],
      status: 'ACTIVE',
      reportCount: 1,
    });

    const updatedIncidents = useLogisticsStore.getState().incidents;
    expect(updatedIncidents.length).toBe(initialCount + 1);

    const inc1045 = updatedIncidents.find((i) => i.id === 'INC-1045')!;
    expect(inc1045).toBeDefined();
    expect(inc1045.sourceLabel).toContain('Arun');
    expect(inc1045.verificationStatus).toBe('UNVERIFIED');
  });

  // D3: Network loss sets offline mode and queues incidents without delivering immediate alert
  it('D3: Network loss activates offline mode with lastSyncTime; authority incident during outage is queued', () => {
    const store = useLogisticsStore.getState();

    // 1. Simulate Network Drop
    store.setNetworkOnline(false);

    const offlineState = useLogisticsStore.getState();
    expect(offlineState.isNetworkOnline).toBe(false);
    expect(offlineState.lastSyncTime).toBe('10:29');

    // 2. Simulate Authority Incident occurrence while truck is offline
    store.triggerAuthorityIncident();

    // In offline mode, truck does NOT yet have the active alert popup
    const stateDuringOutage = useLogisticsStore.getState();
    expect(stateDuringOutage.activeAlertTrip104).toBeNull();
  });

  // D4: Network restore triggers sync and delivers the pending disruption alert
  it('D4: Network restoration synchronizes queued incidents and delivers disruption alert to TRIP-104', async () => {
    const store = useLogisticsStore.getState();

    // 1. Drop network
    store.setNetworkOnline(false);

    // 2. Incident happens on server
    store.triggerAuthorityIncident();

    // 3. Restore network
    store.setNetworkOnline(true);

    // Wait for sync timeout (1.2s in store)
    await new Promise((r) => setTimeout(r, 1400));

    const restoredState = useLogisticsStore.getState();
    expect(restoredState.isNetworkOnline).toBe(true);
    expect(restoredState.isSyncing).toBe(false);
    expect(restoredState.activeAlertTrip104).not.toBeNull();
    expect(restoredState.activeAlertTrip104?.incident.id).toBe('INC-1042');
    expect(restoredState.activeAlertTrip104?.timeToImpactMin).toBe(23);
  });

  // D5: Emergency SOS creates alert; offline emergency is marked queued
  it('D5: Emergency SOS creates critical alert; offline emergency queues cleanly', () => {
    const store = useLogisticsStore.getState();

    // Online Emergency
    store.triggerEmergency('ACCIDENT', 'Vehicle Collision');
    let emgState = useLogisticsStore.getState();
    expect(emgState.activeEmergency).not.toBeNull();
    expect(emgState.activeEmergency?.type).toBe('ACCIDENT');
    expect(emgState.activeEmergency?.isQueuedOffline).toBe(false);
    expect(emgState.activeEmergency?.driverName).toBe('Arun');

    // Reset and test Offline Emergency
    store.resolveEmergency();
    store.setNetworkOnline(false);

    store.triggerEmergency('BREAKDOWN', 'Engine Breakdown');
    emgState = useLogisticsStore.getState();
    expect(emgState.activeEmergency).toBeNull(); // Not sent live yet
    expect(emgState.offlineQueue.some((q) => q.type === 'EMERGENCY_SUBMIT')).toBe(true);
  });
});
