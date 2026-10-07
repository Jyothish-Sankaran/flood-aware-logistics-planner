import { create } from 'zustand';
import {
  Trip,
  Incident,
  RouteOption,
  CANONICAL_PRIMARY_TRIP,
  CANONICAL_SECONDARY_TRIP,
  CANONICAL_ROUTES,
  SEED_INCIDENTS,
  CANONICAL_TIMELINE_STEPS,
  TimelineEvent,
  CANONICAL_INCIDENT_1042,
} from '../scenario/scenario';
import { evaluateTripImpact } from '../engines/impactEngine';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType:
    | 'TRIP_CREATED'
    | 'INCIDENT_INGESTED'
    | 'IMPACT_EVALUATED'
    | 'REROUTE_EXECUTED'
    | 'EMERGENCY_TRIGGERED'
    | 'NETWORK_STATE_CHANGED';
  title: string;
  description: string;
  actor: string;
  details?: Record<string, unknown>;
}

export interface EmergencyAlert {
  id: string;
  type: 'ACCIDENT' | 'MEDICAL' | 'BREAKDOWN' | 'SECURITY';
  typeLabel: string;
  driverName: string;
  vehicleId: string;
  tripId: string;
  cargoName: string;
  coordinates: [number, number];
  timestamp: string;
  isQueuedOffline: boolean;
  status: 'PENDING' | 'RESOLVED';
}

export interface LogisticsState {
  // Trips
  primaryTrip: Trip;
  secondaryTrip: Trip;
  availableRoutes: RouteOption[];
  selectedRouteId: 'R1' | 'R2' | 'R3';

  // Incidents
  incidents: Incident[];
  activeAlertTrip104: {
    incident: Incident;
    distanceAheadKm: number;
    timeToImpactMin: number;
    recommendedRouteId: 'R2';
  } | null;
  suppressedAlertsCount: number;

  // Emergency SOS
  activeEmergency: EmergencyAlert | null;

  // Map & Visuals
  showFloodLayer: boolean;
  selectedIncident: Incident | null;

  // Data & Network Status
  routingStatus: { isLive: boolean; source: string };
  weatherStatus: { isLive: boolean; source: string };
  isNetworkOnline: boolean;
  lastSyncTime: string;
  offlineQueue: { type: string; payload: unknown; timestamp: string }[];
  isSyncing: boolean;

  // Driver App Preferences
  voiceAlertsEnabled: boolean;

  // Demo Controls
  demoClock: string;
  currentStepIndex: number;
  timelineSteps: TimelineEvent[];
  playbackSpeed: number;
  isSimulatingGps: boolean;

  // Impact Assumptions
  assumptions: {
    cargoValueRs: number;
    spoilageRatePerHour: number;
    fuelCostPerKmRs: number;
    idleCostPerHourRs: number;
    expectedQueueMinutes: number;
  };

  // Audit Log
  auditLogs: AuditLogEntry[];

  // Actions
  setShowFloodLayer: (show: boolean) => void;
  setSelectedIncident: (incident: Incident | null) => void;
  setRoutingStatus: (status: { isLive: boolean; source: string }) => void;
  setWeatherStatus: (status: { isLive: boolean; source: string }) => void;
  setNetworkOnline: (online: boolean) => void;
  setSelectedRouteId: (routeId: 'R1' | 'R2' | 'R3') => void;
  setPlaybackSpeed: (speed: number) => void;
  setIsSimulatingGps: (sim: boolean) => void;
  setVoiceAlertsEnabled: (enabled: boolean) => void;
  updateAssumptions: (partial: Partial<LogisticsState['assumptions']>) => void;

  // Core Demo & Pipeline Actions
  addIncident: (incident: Incident) => void;
  triggerAuthorityIncident: () => void;
  acceptRerouteTrip104: () => void;
  dismissAlertTrip104: () => void;
  triggerEmergency: (type: EmergencyAlert['type'], typeLabel: string) => void;
  resolveEmergency: () => void;
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  advanceTimelineStep: () => void;
  setDemoStep: (stepIndex: number) => void;
  resetDemo: () => void;
  updateGpsPosition: (position: [number, number], progressPercent: number) => void;
}

const getInitialState = () => ({
  primaryTrip: { ...CANONICAL_PRIMARY_TRIP },
  secondaryTrip: { ...CANONICAL_SECONDARY_TRIP },
  availableRoutes: [...CANONICAL_ROUTES],
  selectedRouteId: 'R1' as const,
  incidents: [...SEED_INCIDENTS],
  activeAlertTrip104: null,
  suppressedAlertsCount: 1,
  activeEmergency: null,
  showFloodLayer: true,
  selectedIncident: null,
  routingStatus: { isLive: false, source: 'Offline Snapshot' },
  weatherStatus: { isLive: false, source: 'Offline Snapshot' },
  isNetworkOnline: true,
  lastSyncTime: '09:00',
  offlineQueue: [],
  isSyncing: false,
  voiceAlertsEnabled: true,
  demoClock: '09:00',
  currentStepIndex: 0,
  timelineSteps: CANONICAL_TIMELINE_STEPS,
  playbackSpeed: 1,
  isSimulatingGps: false,
  assumptions: {
    cargoValueRs: 60000,
    spoilageRatePerHour: 0.12,
    fuelCostPerKmRs: 24.0,
    idleCostPerHourRs: 350.0,
    expectedQueueMinutes: 90,
  },
  auditLogs: [
    {
      id: 'LOG-001',
      timestamp: '09:00',
      eventType: 'TRIP_CREATED' as const,
      title: 'Trip TRIP-104 Dispatched',
      description: 'Vehicle VH-104 departed Palakkad for Kochi carrying 500kg Fresh Vegetables via NH 544 (R1).',
      actor: 'System / Dispatcher',
      details: { cargo: 'Fresh Vegetables', priority: 'MINIMIZE_DELAY', route: 'R1' },
    },
  ],
});

export const useLogisticsStore = create<LogisticsState>((set, get) => ({
  ...getInitialState(),

  setShowFloodLayer: (show) => set({ showFloodLayer: show }),
  setSelectedIncident: (incident) => set({ selectedIncident: incident }),
  setRoutingStatus: (status) => set({ routingStatus: status }),
  setWeatherStatus: (status) => set({ weatherStatus: status }),
  setSelectedRouteId: (routeId) => set({ selectedRouteId: routeId }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setIsSimulatingGps: (sim) => set({ isSimulatingGps: sim }),
  setVoiceAlertsEnabled: (enabled) => set({ voiceAlertsEnabled: enabled }),

  updateAssumptions: (partial) =>
    set((state) => ({
      assumptions: { ...state.assumptions, ...partial },
    })),

  updateGpsPosition: (position, progressPercent) => {
    set((state) => ({
      primaryTrip: {
        ...state.primaryTrip,
        currentPosition: position,
        currentProgressPercent: progressPercent,
      },
    }));
  },

  setNetworkOnline: (online) => {
    const prevOnline = get().isNetworkOnline;
    const nowClock = get().demoClock;

    if (!online && prevOnline) {
      // Transition to Offline
      set({
        isNetworkOnline: false,
        lastSyncTime: '10:29',
      });
      get().addAuditLog({
        eventType: 'NETWORK_STATE_CHANGED',
        title: 'Cellular Connectivity Lost',
        description: 'App transitioned to Offline Mode. Serving cached route geometries and prior incidents.',
        actor: 'Telemetry Monitor',
      });
    } else if (online && !prevOnline) {
      // Restoring Online
      set({ isSyncing: true });
      setTimeout(() => {
        const queue = get().offlineQueue;
        const currentClock = nowClock === '09:00' ? '10:42' : nowClock;

        // Flush queued items
        queue.forEach((item) => {
          if (item.type === 'INCIDENT_SUBMIT') {
            const inc = item.payload as Incident;
            set((s) => ({
              incidents: [inc, ...s.incidents.filter((i) => i.id !== inc.id)],
            }));
          } else if (item.type === 'EMERGENCY_SUBMIT') {
            const emg = item.payload as EmergencyAlert;
            set({
              activeEmergency: { ...emg, isQueuedOffline: false },
            });
          }
        });

        // Re-evaluate impact on active trip if INC-1042 exists
        const r1Incident = get().incidents.find((i) => i.id === 'INC-1042');
        if (r1Incident && get().primaryTrip.activeRouteId === 'R1') {
          const r1Route = get().availableRoutes.find((r) => r.id === 'R1')!;
          const impact = evaluateTripImpact(get().primaryTrip, r1Route, r1Incident, currentClock);
          if (impact.affectsTrip && impact.recommendedAction === 'REROUTE_NOW') {
            set((s) => ({
              primaryTrip: { ...s.primaryTrip, status: 'CRITICAL' },
              activeAlertTrip104: {
                incident: r1Incident,
                distanceAheadKm: impact.distanceAheadKm || 24.0,
                timeToImpactMin: impact.timeToImpactMin || 23,
                recommendedRouteId: 'R2',
              },
            }));
          }
        }

        set({
          isNetworkOnline: true,
          isSyncing: false,
          offlineQueue: [],
          lastSyncTime: currentClock,
        });

        get().addAuditLog({
          eventType: 'NETWORK_STATE_CHANGED',
          title: 'Network Restored & Synchronized',
          description: 'Connection re-established. Background telemetry flushed and incident layer synced.',
          actor: 'Sync Service',
        });
      }, 1200);
    }
  },

  addAuditLog: (entry) => {
    const clock = get().demoClock;
    const newEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: clock,
      ...entry,
    };
    set((state) => ({
      auditLogs: [newEntry, ...state.auditLogs],
    }));
  },

  addIncident: (incident) => {
    const isOnline = get().isNetworkOnline;
    if (!isOnline) {
      // Queue offline report
      set((state) => ({
        offlineQueue: [
          ...state.offlineQueue,
          { type: 'INCIDENT_SUBMIT', payload: incident, timestamp: state.demoClock },
        ],
      }));
      return;
    }

    set((state) => ({
      incidents: [incident, ...state.incidents.filter((i) => i.id !== incident.id)],
    }));

    get().addAuditLog({
      eventType: 'INCIDENT_INGESTED',
      title: `Incident Ingested: ${incident.typeLabel}`,
      description: `Location: ${incident.locationName} | Source: ${incident.sourceLabel} | Severity: ${incident.severity}`,
      actor: incident.sourceLabel,
      details: { incidentId: incident.id, verification: incident.verificationStatus },
    });
  },

  triggerAuthorityIncident: () => {
    const incident = { ...CANONICAL_INCIDENT_1042 };
    const isOnline = get().isNetworkOnline;

    if (!isOnline) {
      // Authority incident occurred at server side, but offline truck does not receive until sync
      set((state) => ({
        incidents: [incident, ...state.incidents.filter((i) => i.id !== incident.id)],
        demoClock: '10:17',
      }));
      return;
    }

    // Online delivery
    set((state) => ({
      incidents: [incident, ...state.incidents.filter((i) => i.id !== incident.id)],
      demoClock: '10:17',
      primaryTrip: {
        ...state.primaryTrip,
        status: 'CRITICAL',
        currentPosition: [10.3070, 76.3330], // Chalakudy
        currentProgressPercent: 55,
      },
      activeAlertTrip104: {
        incident,
        distanceAheadKm: 24.0,
        timeToImpactMin: 23,
        recommendedRouteId: 'R2',
      },
    }));

    // Trigger voice alert if enabled
    if (get().voiceAlertsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(
          'Warning. Road blockage detected ahead. An alternative route is available.'
        );
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    }

    get().addAuditLog({
      eventType: 'IMPACT_EVALUATED',
      title: 'Disruption Impact Triggered for TRIP-104',
      description: 'Incident INC-1042 (Angamaly) detected on remaining route. Distance ahead: 24.0 km. Time to impact: 23 min. Status set to CRITICAL.',
      actor: 'Impact Engine',
      details: { tripId: 'TRIP-104', vehicleId: 'VH-104', distanceAheadKm: 24.0, timeToImpactMin: 23 },
    });
  },

  acceptRerouteTrip104: () => {
    set((state) => ({
      selectedRouteId: 'R2',
      primaryTrip: {
        ...state.primaryTrip,
        activeRouteId: 'R2',
        status: 'REROUTED',
        currentEta: '11:27',
      },
      activeAlertTrip104: null,
      demoClock: '10:19',
    }));

    get().addAuditLog({
      eventType: 'REROUTE_EXECUTED',
      title: 'Driver Accepted Reroute to R2',
      description: 'TRIP-104 rerouted to R2 Bypass via Mala-Parur. Updated ETA: 11:27 (+17 min delay; avoided ~90 min blockage).',
      actor: 'Driver Arun (VH-104)',
      details: { oldRoute: 'R1', newRoute: 'R2', newEta: '11:27' },
    });
  },

  dismissAlertTrip104: () => {
    set({ activeAlertTrip104: null });
  },

  triggerEmergency: (type, typeLabel) => {
    const isOnline = get().isNetworkOnline;
    const trip = get().primaryTrip;
    const alert: EmergencyAlert = {
      id: `SOS-${Date.now()}`,
      type,
      typeLabel,
      driverName: trip.vehicle.driver,
      vehicleId: trip.vehicle.id,
      tripId: trip.id,
      cargoName: trip.cargo.name,
      coordinates: trip.currentPosition,
      timestamp: get().demoClock,
      isQueuedOffline: !isOnline,
      status: 'PENDING',
    };

    if (!isOnline) {
      set((state) => ({
        offlineQueue: [
          ...state.offlineQueue,
          { type: 'EMERGENCY_SUBMIT', payload: alert, timestamp: state.demoClock },
        ],
      }));
    } else {
      set({ activeEmergency: alert });
      get().addAuditLog({
        eventType: 'EMERGENCY_TRIGGERED',
        title: `EMERGENCY SOS: ${typeLabel}`,
        description: `Driver ${trip.vehicle.driver} (${trip.vehicle.id}) triggered emergency at ${trip.currentPosition.join(', ')}.`,
        actor: 'Driver App SOS',
        details: { type, vehicle: trip.vehicle.id },
      });
    }
  },

  resolveEmergency: () => {
    set({ activeEmergency: null });
  },

  setDemoStep: (stepIndex) => {
    const steps = get().timelineSteps;
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    const step = steps[stepIndex];
    set({ currentStepIndex: stepIndex, demoClock: step.time });

    if (stepIndex === 0) {
      get().resetDemo();
    } else if (stepIndex === 1) {
      // 10:10 Incident logged
      set((state) => ({
        incidents: [CANONICAL_INCIDENT_1042, ...state.incidents.filter((i) => i.id !== CANONICAL_INCIDENT_1042.id)],
        primaryTrip: {
          ...state.primaryTrip,
          status: 'IN_TRANSIT',
          currentPosition: step.truckPosition,
          currentProgressPercent: step.truckProgressPercent,
        },
      }));
    } else if (stepIndex === 2) {
      // 10:17 Impact detected
      get().triggerAuthorityIncident();
    } else if (stepIndex === 3) {
      // 10:19 Reroute accepted
      get().acceptRerouteTrip104();
    } else if (stepIndex === 4) {
      // 10:30 Network lost
      get().setNetworkOnline(false);
    } else if (stepIndex === 5) {
      // 10:42 Network restored
      get().setNetworkOnline(true);
    }
  },

  advanceTimelineStep: () => {
    const current = get().currentStepIndex;
    const next = current + 1;
    if (next < get().timelineSteps.length) {
      get().setDemoStep(next);
    }
  },

  resetDemo: () => {
    set(getInitialState());
  },
}));
