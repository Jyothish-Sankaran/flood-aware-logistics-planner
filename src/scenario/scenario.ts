// Canonical Single Source of Truth for LDSS
// KeralAI Grand Challenge 2026 - Challenge 5: Flood-Aware Logistics Planner for Kerala

export type CargoCategory = 'PERISHABLE' | 'MEDICAL' | 'HIGH_VALUE' | 'HEAVY_MACHINERY' | 'GENERAL';

export interface CargoProfile {
  name: string;
  category: CargoCategory;
  weightKg: number;
  valueRs: number;
  isPerishable: boolean;
  requiredDeliveryTime?: string;
  specialHandling?: string;
}

export type VehicleType = 'MINI_TRUCK' | 'LORRY' | 'HEAVY_TRUCK' | 'REFRIGERATED_TRUCK';

export interface VehicleProfile {
  id: string;
  name: string;
  type: VehicleType;
  driver: string;
  driverPhone: string;
  capacityKg: number;
  currentLocation?: [number, number];
  restrictions?: string[];
}

export interface RouteSegment {
  id: string;
  name: string;
  from: string;
  to: string;
  distanceKm: number;
  durationMinutes: number;
  roadQuality: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
  floodVulnerability: 'LOW' | 'MODERATE' | 'HIGH';
  isHeavyVehicleSuitable: boolean;
}

export interface RouteOption {
  id: 'R1' | 'R2' | 'R3';
  name: string;
  description: string;
  distanceKm: number;
  durationMinutes: number;
  eta: string;
  coordinates: [number, number][]; // [lat, lng]
  viaWaypoints: string[];
  baseRiskScore: number;
  defaultRole: 'FASTEST' | 'SAFEST' | 'INLAND_ALTERNATIVE';
  segments: RouteSegment[];
}

export type IncidentType =
  | 'FALLEN_TREE'
  | 'FLOODED_ROAD'
  | 'LANDSLIDE'
  | 'ROAD_BLOCKED'
  | 'ACCIDENT'
  | 'HEAVY_TRAFFIC'
  | 'BRIDGE_CLOSURE'
  | 'ROAD_DAMAGE'
  | 'VEHICLE_BREAKDOWN'
  | 'OTHER';

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type VerificationStatus = 'VERIFIED' | 'CORROBORATED' | 'UNVERIFIED' | 'REJECTED';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Incident {
  id: string;
  type: IncidentType;
  typeLabel: string;
  locationName: string;
  coordinates: [number, number]; // [lat, lng]
  timestamp: string; // HH:MM
  severity: IncidentSeverity;
  source: 'TRAFFIC_AUTHORITY' | 'FIRE_RESCUE' | 'POLICE' | 'DRIVER_REPORT' | 'CITIZEN';
  sourceLabel: string;
  sourceDriverId?: string;
  verificationStatus: VerificationStatus;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0.0 - 1.0
  description: string;
  affectedRouteIds: ('R1' | 'R2' | 'R3')[];
  status: 'ACTIVE' | 'RESOLVED' | 'SUPPRESSED';
  reportCount?: number;
  reporters?: { driverId: string; timestamp: string; latLng: [number, number] }[];
}

export interface Trip {
  id: string;
  origin: string;
  originCoords: [number, number];
  destination: string;
  destinationCoords: [number, number];
  cargo: CargoProfile;
  vehicle: VehicleProfile;
  departureTime: string;
  activeRouteId: 'R1' | 'R2' | 'R3';
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'CRITICAL' | 'REROUTED' | 'COMPLETED' | 'SAFE';
  currentPosition: [number, number];
  currentProgressPercent: number;
  distanceTraveledKm: number;
  remainingDistanceKm: number;
  currentEta: string;
}

export interface TimelineEvent {
  time: string; // HH:MM
  title: string;
  description: string;
  truckPosition: [number, number];
  truckProgressPercent: number;
  incidentId?: string;
  actionRequired?: boolean;
}

// Canonical Polylines for R1, R2, R3 (Accurate Kerala NH 544 & Bypass corridors)
export const CANONICAL_COORDINATES: { [key in 'R1' | 'R2' | 'R3']: [number, number][] } = {
  // R1: Palakkad -> Alathur -> Vadakkencherry -> Mannuthy (Thrissur) -> Chalakudy -> Angamaly -> Aluva -> Edappally -> Kochi
  R1: [
    [10.7867, 76.6548], // Palakkad Town
    [10.6433, 76.5414], // Alathur
    [10.5898, 76.4719], // Vadakkencherry
    [10.5510, 76.3500], // Kuthiran Tunnel
    [10.5350, 76.2450], // Mannuthy (Thrissur Bypass)
    [10.4500, 76.2700], // Puthukkad
    [10.3800, 76.3000], // Kodakara
    [10.3070, 76.3330], // Chalakudy (At 10:17 truck position)
    [10.2500, 76.3600], // Koratty
    [10.1960, 76.3860], // Angamaly (Incident INC-1042 Location)
    [10.1450, 76.3680], // Nedumbassery / Cochin Airport
    [10.1076, 76.3516], // Aluva
    [10.0400, 76.3200], // Kalamassery
    [9.9800, 76.2800],  // Edappally
    [9.9312, 76.2673]   // Kochi Port / City Center
  ],
  // R2: Palakkad -> Thrissur -> Chalakudy -> Mala -> North Paravur -> Varapuzha -> Edappally -> Kochi (Diverges from Chalakudy/Kodakara towards coastal bypass, avoids Angamaly)
  R2: [
    [10.7867, 76.6548], // Palakkad Town
    [10.6433, 76.5414], // Alathur
    [10.5898, 76.4719], // Vadakkencherry
    [10.5510, 76.3500], // Kuthiran
    [10.5350, 76.2450], // Mannuthy
    [10.4500, 76.2700], // Puthukkad
    [10.3800, 76.3000], // Kodakara
    [10.3070, 76.3330], // Chalakudy Divergence Point
    [10.2185, 76.2612], // Mala (Westwards bypass, safely away from Angamaly)
    [10.1800, 76.2400], // Puthenvelikkara
    [10.1416, 76.2307], // North Paravur
    [10.0750, 76.2650], // Varapuzha Bridge
    [10.0200, 76.2900], // Cheranallur
    [9.9800, 76.2800],  // Edappally
    [9.9312, 76.2673]   // Kochi Port
  ],
  // R3: Palakkad -> Ottapalam -> Shornur -> Chelakkara -> Wadakkanchery -> Perumbavoor -> Kakkanad -> Kochi
  R3: [
    [10.7867, 76.6548], // Palakkad
    [10.7710, 76.3780], // Ottapalam
    [10.7600, 76.2700], // Shornur
    [10.6900, 76.3300], // Chelakkara
    [10.6000, 76.2400], // Wadakkanchery
    [10.4800, 76.4000], // Ollur East
    [10.3500, 76.4800], // Vellikulangara
    [10.1150, 76.4750], // Perumbavoor
    [10.0150, 76.3450], // Kakkanad Infopark
    [9.9312, 76.2673]   // Kochi
  ]
};

// Canonical Route Definitions
export const CANONICAL_ROUTES: RouteOption[] = [
  {
    id: 'R1',
    name: 'NH 544 via Thrissur-Chalakudy-Angamaly',
    description: 'National highway freight corridor; fastest straight connection; passes through Angamaly.',
    distanceKm: 138.0,
    durationMinutes: 130, // 2h 10m
    eta: '11:10',
    coordinates: CANONICAL_COORDINATES.R1,
    viaWaypoints: ['Thrissur', 'Chalakudy', 'Angamaly', 'Aluva'],
    baseRiskScore: 35,
    defaultRole: 'FASTEST',
    segments: [
      {
        id: 'SEG-101',
        name: 'Palakkad - Thrissur (NH 544)',
        from: 'Palakkad',
        to: 'Thrissur',
        distanceKm: 68.0,
        durationMinutes: 65,
        roadQuality: 'EXCELLENT',
        floodVulnerability: 'LOW',
        isHeavyVehicleSuitable: true,
      },
      {
        id: 'SEG-102',
        name: 'Thrissur - Chalakudy',
        from: 'Thrissur',
        to: 'Chalakudy',
        distanceKm: 32.0,
        durationMinutes: 30,
        roadQuality: 'GOOD',
        floodVulnerability: 'MODERATE',
        isHeavyVehicleSuitable: true,
      },
      {
        id: 'SEG-103',
        name: 'Chalakudy - Angamaly (Incident Zone)',
        from: 'Chalakudy',
        to: 'Angamaly',
        distanceKm: 24.0,
        durationMinutes: 23,
        roadQuality: 'GOOD',
        floodVulnerability: 'HIGH',
        isHeavyVehicleSuitable: true,
      },
      {
        id: 'SEG-104',
        name: 'Angamaly - Kochi',
        from: 'Angamaly',
        to: 'Kochi',
        distanceKm: 14.0,
        durationMinutes: 12,
        roadQuality: 'EXCELLENT',
        floodVulnerability: 'MODERATE',
        isHeavyVehicleSuitable: true,
      }
    ]
  },
  {
    id: 'R2',
    name: 'Bypass via Chalakudy-Kodakara-Mala-Parur-Aluva',
    description: 'Western coastal/state highway bypass; +17 min delay; bypasses Angamaly choke points; minimal flood exposure.',
    distanceKm: 152.0,
    durationMinutes: 147, // 2h 27m (+17 min vs R1)
    eta: '11:27',
    coordinates: CANONICAL_COORDINATES.R2,
    viaWaypoints: ['Thrissur', 'Chalakudy', 'Mala', 'North Paravur', 'Aluva'],
    baseRiskScore: 18,
    defaultRole: 'SAFEST',
    segments: [
      {
        id: 'SEG-201',
        name: 'Palakkad - Chalakudy (NH 544)',
        from: 'Palakkad',
        to: 'Chalakudy',
        distanceKm: 100.0,
        durationMinutes: 95,
        roadQuality: 'EXCELLENT',
        floodVulnerability: 'LOW',
        isHeavyVehicleSuitable: true,
      },
      {
        id: 'SEG-202',
        name: 'Chalakudy - Mala - N. Paravur (SH 21 / Coastal)',
        from: 'Chalakudy',
        to: 'North Paravur',
        distanceKm: 34.0,
        durationMinutes: 34,
        roadQuality: 'GOOD',
        floodVulnerability: 'LOW',
        isHeavyVehicleSuitable: true,
      },
      {
        id: 'SEG-203',
        name: 'North Paravur - Kochi City',
        from: 'North Paravur',
        to: 'Kochi',
        distanceKm: 18.0,
        durationMinutes: 18,
        roadQuality: 'GOOD',
        floodVulnerability: 'LOW',
        isHeavyVehicleSuitable: true,
      }
    ]
  },
  {
    id: 'R3',
    name: 'Inland Alternative via Shornur-Perumbavoor',
    description: 'Eastern inland corridor; avoids coastal waterlogging but has moderate river-crossing vulnerability.',
    distanceKm: 165.0,
    durationMinutes: 161, // 2h 41m
    eta: '11:41',
    coordinates: CANONICAL_COORDINATES.R3,
    viaWaypoints: ['Ottapalam', 'Shornur', 'Perumbavoor', 'Kakkanad'],
    baseRiskScore: 42,
    defaultRole: 'INLAND_ALTERNATIVE',
    segments: [
      {
        id: 'SEG-301',
        name: 'Palakkad - Shornur (State Highway)',
        from: 'Palakkad',
        to: 'Shornur',
        distanceKm: 48.0,
        durationMinutes: 46,
        roadQuality: 'MODERATE',
        floodVulnerability: 'MODERATE',
        isHeavyVehicleSuitable: false, // Narrow bridge
      },
      {
        id: 'SEG-302',
        name: 'Shornur - Perumbavoor Inland',
        from: 'Shornur',
        to: 'Perumbavoor',
        distanceKm: 85.0,
        durationMinutes: 83,
        roadQuality: 'MODERATE',
        floodVulnerability: 'MODERATE',
        isHeavyVehicleSuitable: true,
      },
      {
        id: 'SEG-303',
        name: 'Perumbavoor - Kochi via Kakkanad',
        from: 'Perumbavoor',
        to: 'Kochi',
        distanceKm: 32.0,
        durationMinutes: 32,
        roadQuality: 'GOOD',
        floodVulnerability: 'LOW',
        isHeavyVehicleSuitable: true,
      }
    ]
  }
];

// Canonical Primary Trip TRIP-104 (VH-104)
export const CANONICAL_PRIMARY_TRIP: Trip = {
  id: 'TRIP-104',
  origin: 'Palakkad',
  originCoords: [10.7867, 76.6548],
  destination: 'Kochi',
  destinationCoords: [9.9312, 76.2673],
  cargo: {
    name: 'Fresh Vegetables',
    category: 'PERISHABLE',
    weightKg: 500,
    valueRs: 60000,
    isPerishable: true,
    requiredDeliveryTime: '12:00',
    specialHandling: 'Temperature controlled (4-8°C), time-sensitive perishable goods'
  },
  vehicle: {
    id: 'VH-104',
    name: 'Refrigerated Truck VH-104',
    type: 'REFRIGERATED_TRUCK',
    driver: 'Arun',
    driverPhone: '+91 98470 12345',
    capacityKg: 1500,
    currentLocation: [10.3070, 76.3330], // Chalakudy at 10:17
  },
  departureTime: '09:00',
  activeRouteId: 'R1',
  status: 'IN_TRANSIT',
  currentPosition: [10.3070, 76.3330],
  currentProgressPercent: 55, // Near Chalakudy
  distanceTraveledKm: 100.0,
  remainingDistanceKm: 38.0,
  currentEta: '11:10'
};

// Canonical Secondary Trip TRIP-208 (VH-208) - Unaffected by Angamaly Incident
export const CANONICAL_SECONDARY_TRIP: Trip = {
  id: 'TRIP-208',
  origin: 'Thrissur',
  originCoords: [10.5276, 76.2144],
  destination: 'Kochi',
  destinationCoords: [9.9312, 76.2673],
  cargo: {
    name: 'Essential Medicines',
    category: 'MEDICAL',
    weightKg: 300,
    valueRs: 250000,
    isPerishable: false,
    requiredDeliveryTime: '13:00',
    specialHandling: 'Critical medical supplies, hospital emergency consignment'
  },
  vehicle: {
    id: 'VH-208',
    name: 'Medical Logistics Van VH-208',
    type: 'LORRY',
    driver: 'Rahul',
    driverPhone: '+91 94471 67890',
    capacityKg: 1000,
    currentLocation: [10.2185, 76.2612] // Near Mala on bypass
  },
  departureTime: '09:30',
  activeRouteId: 'R2',
  status: 'SAFE',
  currentPosition: [10.2185, 76.2612],
  currentProgressPercent: 40,
  distanceTraveledKm: 35.0,
  remainingDistanceKm: 42.0,
  currentEta: '11:20'
};

// Canonical Authority Incident INC-1042 (Fallen Tree at Angamaly)
export const CANONICAL_INCIDENT_1042: Incident = {
  id: 'INC-1042',
  type: 'FALLEN_TREE',
  typeLabel: 'Fallen Tree Road Blockage',
  locationName: 'Angamaly Junction (NH 544)',
  coordinates: [10.1960, 76.3860], // Angamaly
  timestamp: '10:10',
  severity: 'HIGH',
  source: 'TRAFFIC_AUTHORITY',
  sourceLabel: 'Kerala Traffic Police Authority',
  verificationStatus: 'VERIFIED',
  confidence: 'HIGH',
  confidenceScore: 0.98,
  description: 'Large banyan tree fallen across both carriageways near Angamaly south bypass. Total obstruction. Fire force clearing underway.',
  affectedRouteIds: ['R1'],
  status: 'ACTIVE',
  reportCount: 1
};

// Seed Incidents
export const SEED_INCIDENTS: Incident[] = [
  CANONICAL_INCIDENT_1042,
  {
    id: 'INC-1043',
    type: 'FLOODED_ROAD',
    typeLabel: 'Flooded Low-Lying Roadway',
    locationName: 'Aluva Bank Road / Sub-Station Lane',
    coordinates: [10.1076, 76.3516],
    timestamp: '09:45',
    severity: 'MEDIUM',
    source: 'DRIVER_REPORT',
    sourceLabel: 'Driver Report (Single)',
    sourceDriverId: 'DRV-88',
    verificationStatus: 'UNVERIFIED',
    confidence: 'LOW',
    confidenceScore: 0.45,
    description: 'Waterlogging reported along service lane, main highway currently passable with reduced speed.',
    affectedRouteIds: ['R1'],
    status: 'ACTIVE',
    reportCount: 1,
    reporters: [
      { driverId: 'DRV-88', timestamp: '09:45', latLng: [10.1080, 76.3520] }
    ]
  },
  {
    id: 'INC-1044',
    type: 'ACCIDENT',
    typeLabel: 'Multi-Vehicle Collision',
    locationName: 'Kalamassery Container Road Cross',
    coordinates: [10.0400, 76.3200],
    timestamp: '09:50',
    severity: 'MEDIUM',
    source: 'DRIVER_REPORT',
    sourceLabel: 'Corroborated Driver Reports (3)',
    verificationStatus: 'CORROBORATED',
    confidence: 'HIGH',
    confidenceScore: 0.92,
    description: 'Container truck overturned. Slow-moving traffic on right lane.',
    affectedRouteIds: ['R1'],
    status: 'ACTIVE',
    reportCount: 3,
    reporters: [
      { driverId: 'DRV-12', timestamp: '09:48', latLng: [10.0402, 76.3205] },
      { driverId: 'DRV-45', timestamp: '09:50', latLng: [10.0398, 76.3195] },
      { driverId: 'DRV-90', timestamp: '09:53', latLng: [10.0405, 76.3210] }
    ]
  }
];

// Timeline Events for Demo Runner
export const CANONICAL_TIMELINE_STEPS: TimelineEvent[] = [
  {
    time: '09:00',
    title: 'Trip Departed',
    description: 'Refrigerated Truck VH-104 departs Palakkad for Kochi carrying 500 kg Fresh Vegetables (Perishable). Recommended Route R1 (ETA 11:10).',
    truckPosition: [10.7867, 76.6548],
    truckProgressPercent: 0
  },
  {
    time: '10:10',
    title: 'Authority Incident Logged',
    description: 'Kerala Traffic Police publishes INC-1042 (Tree Fall at Angamaly, VERIFIED, HIGH severity).',
    truckPosition: [10.3600, 76.3150],
    truckProgressPercent: 48,
    incidentId: 'INC-1042'
  },
  {
    time: '10:17',
    title: 'Incident Ingested & Impact Evaluated',
    description: 'LDSS impact engine detects INC-1042 directly on R1 remaining route. Truck is at Chalakudy, 24.0 km ahead of Angamaly (23 min to impact). Urgent reroute recommended.',
    truckPosition: [10.3070, 76.3330],
    truckProgressPercent: 55,
    incidentId: 'INC-1042',
    actionRequired: true
  },
  {
    time: '10:19',
    title: 'Driver Accepts Reroute to R2',
    description: 'Driver Arun accepts R2 Bypass via Mala-Parur. Updated ETA: 11:27 (+17 min delay, but avoids 90 min tree clearance queue).',
    truckPosition: [10.3070, 76.3330],
    truckProgressPercent: 55
  },
  {
    time: '10:30',
    title: 'Monsoon Network Drop (Offline Mode)',
    description: 'Cellular network lost near coastal patch. App shifts to Offline Cached Mode (using snapshot R2 geometry and cached incidents). Last sync: 10:29.',
    truckPosition: [10.2185, 76.2612],
    truckProgressPercent: 68
  },
  {
    time: '10:42',
    title: 'Network Restored & Synchronized',
    description: 'Connectivity restored. LDSS displays sync badge, flushes background queues, and confirms R2 path remains clear to Kochi.',
    truckPosition: [10.1416, 76.2307],
    truckProgressPercent: 80
  }
];

// Calculation Constants for Accurate Parity
export const DEMO_METRICS = {
  TRUCK_SPEED_KMH: 62.6, // km/h average on highway
  INCIDENT_DISTANCE_KM_AT_1017: 24.0, // km from Chalakudy to Angamaly
  TIME_TO_IMPACT_MIN_AT_1017: 23, // 24 km / (62.6 km/h) * 60 = 23.0 min
  R1_DURATION_MIN: 130, // 2h 10m
  R2_DURATION_MIN: 147, // 2h 27m
  REROUTE_DELAY_PENALTY_MIN: 17, // 147 - 130 = +17 min
  EXPECTED_INCIDENT_QUEUE_TIME_MIN: 90, // Expected wait time if trapped at blockage
  AVOIDED_BLOCKAGE_WAIT_MIN: 73, // 90 - 17 = 73 min net saved
  CARGO_VALUE_RS: 60000,
  DEFAULT_SPOILAGE_RATE_PER_HOUR: 0.12, // 12% value loss per hour delayed
  FUEL_COST_PER_KM_RS: 24.0,
  IDLE_COST_PER_HOUR_RS: 350.0
};
