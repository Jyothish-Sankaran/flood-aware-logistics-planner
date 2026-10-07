import { Incident, IncidentType, VerificationStatus, ConfidenceLevel } from '../scenario/scenario';
import { haversineDistanceKm, LatLngTuple } from '../utils/geo';

export interface DriverReportSubmission {
  driverId: string;
  type: IncidentType;
  coordinates: LatLngTuple;
  timestamp: string; // HH:MM
  description?: string;
  photoUrl?: string;
}

export interface IngestionResult {
  accepted: boolean;
  incident?: Incident;
  escalated?: boolean;
  rejectionReason?: string;
  confidenceExplanation: string;
}

export interface DriverRateRecord {
  driverId: string;
  timestamps: number[]; // Epoch ms
}

// In-memory rate limiting ledger
const driverRateLimitLedger = new Map<string, number[]>();

/**
 * Validates driver anti-abuse rate limits (Max 3 reports per 10 minutes per driver).
 */
export function validateDriverRateLimit(driverId: string, nowMs: number = Date.now()): boolean {
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const history = driverRateLimitLedger.get(driverId) || [];

  // Filter timestamps within current 10-min window
  const recent = history.filter((t) => nowMs - t < windowMs);

  if (recent.length >= 3) {
    return false; // Exceeded limit
  }

  recent.push(nowMs);
  driverRateLimitLedger.set(driverId, recent);
  return true;
}

export function resetRateLimits(): void {
  driverRateLimitLedger.clear();
}

/**
 * Checks if two incident reports match (same type, within 1.5 km, within 30 min).
 */
export function areReportsMatching(
  type1: IncidentType,
  coords1: LatLngTuple,
  time1: string,
  type2: IncidentType,
  coords2: LatLngTuple,
  time2: string
): boolean {
  // Compatible types
  const isTypeMatch =
    type1 === type2 ||
    (type1 === 'FALLEN_TREE' && type2 === 'ROAD_BLOCKED') ||
    (type1 === 'FLOODED_ROAD' && type2 === 'ROAD_BLOCKED');

  if (!isTypeMatch) return false;

  // Distance check (< 1.5 km)
  const distKm = haversineDistanceKm(coords1, coords2);
  if (distKm > 1.5) return false;

  // Time difference check (< 30 min)
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  const diffMin = Math.abs(h1 * 60 + m1 - (h2 * 60 + m2));

  return diffMin <= 30;
}

/**
 * Formats a clear transparent explanation for the incident's confidence score.
 */
export function getConfidenceExplanation(incident: Incident): string {
  if (incident.source === 'TRAFFIC_AUTHORITY' || incident.source === 'POLICE' || incident.source === 'FIRE_RESCUE') {
    return `VERIFIED by Official Authority (${incident.sourceLabel}). Direct telemetry feed with 98% verification index. Immediate operational weight applied.`;
  }

  const count = incident.reportCount || 1;
  if (count >= 3) {
    return `CORROBORATED by ${count} independent vehicle drivers within 1.5 km and 30-minute window. Escalated to HIGH confidence (${(incident.confidenceScore * 100).toFixed(0)}%).`;
  }

  if (count === 2) {
    return `Corroborated by 2 distinct driver reports in close geographic proximity. Escalated to MEDIUM confidence (${(incident.confidenceScore * 100).toFixed(0)}%). Awaiting 3rd report for full confirmation.`;
  }

  return `Single driver submission (Driver ${incident.sourceDriverId || 'Anonymous'}). Classified as UNVERIFIED (LOW confidence ${(incident.confidenceScore * 100).toFixed(0)}%). Impact monitored pending corroboration.`;
}

/**
 * Ingests a new driver report with multi-report corroboration and anti-abuse filtering.
 */
export function ingestDriverReport(
  submission: DriverReportSubmission,
  existingIncidents: Incident[],
  nowMs: number = Date.now()
): IngestionResult {
  // 1. Anti-Abuse Rate Limit Check
  if (!validateDriverRateLimit(submission.driverId, nowMs)) {
    return {
      accepted: false,
      rejectionReason: `Rate limit exceeded for ${submission.driverId}. Maximum 3 hazard submissions allowed per 10-minute window.`,
      confidenceExplanation: 'Rejected by Anti-Abuse Spam Filter.',
    };
  }

  // 2. Check for matching existing incidents to corroborate
  const matchingIncident = existingIncidents.find((inc) =>
    areReportsMatching(
      inc.type,
      inc.coordinates,
      inc.timestamp,
      submission.type,
      submission.coordinates,
      submission.timestamp
    )
  );

  if (matchingIncident) {
    const existingReporters = matchingIncident.reporters || [];
    const alreadyReported = existingReporters.some((r) => r.driverId === submission.driverId);

    if (alreadyReported) {
      return {
        accepted: false,
        rejectionReason: `Duplicate report. Driver ${submission.driverId} has already submitted telemetry for this hazard.`,
        confidenceExplanation: 'Duplicate submission discarded.',
      };
    }

    // Escalate existing incident
    const updatedCount = (matchingIncident.reportCount || 1) + 1;
    let newStatus: VerificationStatus = 'UNVERIFIED';
    let newConfidence: ConfidenceLevel = 'LOW';
    let newConfidenceScore = 0.45;

    if (updatedCount >= 3) {
      newStatus = 'CORROBORATED';
      newConfidence = 'HIGH';
      newConfidenceScore = 0.92;
    } else if (updatedCount === 2) {
      newStatus = 'UNVERIFIED';
      newConfidence = 'MEDIUM';
      newConfidenceScore = 0.72;
    }

    const updatedIncident: Incident = {
      ...matchingIncident,
      reportCount: updatedCount,
      verificationStatus: newStatus,
      confidence: newConfidence,
      confidenceScore: newConfidenceScore,
      sourceLabel: `Corroborated Driver Reports (${updatedCount})`,
      reporters: [
        ...existingReporters,
        { driverId: submission.driverId, timestamp: submission.timestamp, latLng: submission.coordinates },
      ],
    };

    return {
      accepted: true,
      incident: updatedIncident,
      escalated: true,
      confidenceExplanation: getConfidenceExplanation(updatedIncident),
    };
  }

  // 3. Create new Unverified Single Driver Incident
  const newIncident: Incident = {
    id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
    type: submission.type,
    typeLabel: submission.type.replace(/_/g, ' '),
    locationName: `Corridor Lat ${submission.coordinates[0].toFixed(3)}, Lng ${submission.coordinates[1].toFixed(3)}`,
    coordinates: submission.coordinates,
    timestamp: submission.timestamp,
    severity: 'MEDIUM',
    source: 'DRIVER_REPORT',
    sourceLabel: `Driver Report (${submission.driverId})`,
    sourceDriverId: submission.driverId,
    verificationStatus: 'UNVERIFIED',
    confidence: 'LOW',
    confidenceScore: 0.45,
    description: submission.description || 'Hazard reported by driver app.',
    affectedRouteIds: ['R1', 'R2'],
    status: 'ACTIVE',
    reportCount: 1,
    reporters: [
      { driverId: submission.driverId, timestamp: submission.timestamp, latLng: submission.coordinates },
    ],
  };

  return {
    accepted: true,
    incident: newIncident,
    escalated: false,
    confidenceExplanation: getConfidenceExplanation(newIncident),
  };
}
