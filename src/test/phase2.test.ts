import { describe, it, expect, beforeEach } from 'vitest';
import {
  CANONICAL_PRIMARY_TRIP,
  CANONICAL_SECONDARY_TRIP,
  CANONICAL_ROUTES,
  CANONICAL_INCIDENT_1042,
  Trip,
  Incident,
} from '../scenario/scenario';
import { evaluateTripImpact } from '../engines/impactEngine';
import {
  ingestDriverReport,
  validateDriverRateLimit,
  resetRateLimits,
  areReportsMatching,
  getConfidenceExplanation,
} from '../engines/incidentEngine';
import { evaluateRoutes } from '../engines/routeEngine';
import { fetchCorridorWeather } from '../services/weather';

describe('Phase 2 Acceptance Tests: Incident Intelligence, Impact Analysis & Rerouting', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  // C1: Authority incident INC-1042 structure & confidence
  it('C1: Authority incident INC-1042 is properly structured as VERIFIED and HIGH confidence', () => {
    expect(CANONICAL_INCIDENT_1042.id).toBe('INC-1042');
    expect(CANONICAL_INCIDENT_1042.verificationStatus).toBe('VERIFIED');
    expect(CANONICAL_INCIDENT_1042.confidence).toBe('HIGH');
    expect(CANONICAL_INCIDENT_1042.confidenceScore).toBeGreaterThanOrEqual(0.95);
    expect(CANONICAL_INCIDENT_1042.source).toBe('TRAFFIC_AUTHORITY');

    const explanation = getConfidenceExplanation(CANONICAL_INCIDENT_1042);
    expect(explanation).toContain('VERIFIED');
    expect(explanation).toContain('Official Authority');
  });

  // C2: VH-104 impact calculation (Distance ahead: 24.0 km, Time to impact: 23 min, Action: REROUTE_NOW)
  it('C2: Trip TRIP-104 (VH-104) at Chalakudy detects INC-1042 24.0 km ahead with 23 min time-to-impact', () => {
    const r1 = CANONICAL_ROUTES.find((r) => r.id === 'R1')!;
    const tripAtChalakudy: Trip = {
      ...CANONICAL_PRIMARY_TRIP,
      currentPosition: [10.3070, 76.3330], // Chalakudy
      activeRouteId: 'R1',
    };

    const impact = evaluateTripImpact(tripAtChalakudy, r1, CANONICAL_INCIDENT_1042, '10:17');

    expect(impact.affectsTrip).toBe(true);
    expect(impact.suppressed).toBe(false);
    expect(impact.distanceAheadKm).toBe(24.0);
    expect(impact.timeToImpactMin).toBe(23);
    expect(impact.impactLevel).toBe('HIGH');
    expect(impact.recommendedAction).toBe('REROUTE_NOW');
    expect(impact.recommendedAlternativeRouteId).toBe('R2');
  });

  // C2.2: Re-scoring on blockage makes R1 BLOCKED and moves recommendation to R2
  it('C2.2: Re-scoring routes after INC-1042 blocks R1 and recommends R2 (+17 min delay justified)', async () => {
    const weather = await fetchCorridorWeather(true);
    const evalResult = evaluateRoutes(
      CANONICAL_ROUTES,
      CANONICAL_PRIMARY_TRIP.cargo,
      CANONICAL_PRIMARY_TRIP.vehicle,
      weather.waypoints,
      [CANONICAL_INCIDENT_1042]
    );

    const r1 = evalResult.evaluatedRoutes.find((r) => r.route.id === 'R1')!;
    const r2 = evalResult.evaluatedRoutes.find((r) => r.route.id === 'R2')!;

    expect(r1.riskAssessment.isBlocked).toBe(true);
    expect(r1.roleBadges).toContain('BLOCKED');
    expect(r2.roleBadges).toContain('AI RECOMMENDED');
    expect(evalResult.recommendedRoute.route.id).toBe('R2');
    expect(evalResult.explanation.summary).toContain('Route R2 Bypass is recommended');
  });

  // C3: Secondary vehicle VH-208 is NOT affected (Alert suppressed)
  it('C3: Vehicle VH-208 traveling on R2 bypass suppresses INC-1042 alert as non-intersecting', () => {
    const r2 = CANONICAL_ROUTES.find((r) => r.id === 'R2')!;
    const trip208: Trip = {
      ...CANONICAL_SECONDARY_TRIP,
      activeRouteId: 'R2',
    };

    const impact = evaluateTripImpact(trip208, r2, CANONICAL_INCIDENT_1042, '10:17');

    expect(impact.affectsTrip).toBe(false);
    expect(impact.suppressed).toBe(true);
    expect(impact.suppressionReason).toContain('meters away from Route R2');
    expect(impact.impactLevel).toBe('NONE');
    expect(impact.recommendedAction).toBe('NO_ACTION');
  });

  // C4: Impact engine behind-vehicle check
  it('C4.1: Incident located behind the vehicle is properly suppressed', () => {
    const r1 = CANONICAL_ROUTES.find((r) => r.id === 'R1')!;
    // Truck is already at Aluva [10.1076, 76.3516] (past Angamaly)
    const tripPastAngamaly: Trip = {
      ...CANONICAL_PRIMARY_TRIP,
      currentPosition: [10.1076, 76.3516],
      activeRouteId: 'R1',
    };

    const impact = evaluateTripImpact(tripPastAngamaly, r1, CANONICAL_INCIDENT_1042, '10:50');
    expect(impact.affectsTrip).toBe(false);
    expect(impact.suppressed).toBe(true);
    expect(impact.suppressionReason).toContain('behind current vehicle position');
  });

  // C5: Multi-driver report corroboration progression (1 -> 2 -> 3 reports)
  it('C5.1: Three matching driver reports escalate confidence LOW -> MEDIUM -> HIGH', () => {
    const time = '09:40';
    const coords: [number, number] = [10.1960, 76.3860];

    // Report 1
    const res1 = ingestDriverReport(
      { driverId: 'DRV-1', type: 'FALLEN_TREE', coordinates: coords, timestamp: time },
      []
    );
    expect(res1.accepted).toBe(true);
    expect(res1.incident?.verificationStatus).toBe('UNVERIFIED');
    expect(res1.incident?.confidence).toBe('LOW');
    expect(res1.incident?.reportCount).toBe(1);

    // Report 2 (Matching location and time)
    const res2 = ingestDriverReport(
      { driverId: 'DRV-2', type: 'ROAD_BLOCKED', coordinates: [10.1955, 76.3862], timestamp: '09:44' },
      [res1.incident!]
    );
    expect(res2.accepted).toBe(true);
    expect(res2.escalated).toBe(true);
    expect(res2.incident?.confidence).toBe('MEDIUM');
    expect(res2.incident?.reportCount).toBe(2);

    // Report 3
    const res3 = ingestDriverReport(
      { driverId: 'DRV-3', type: 'FALLEN_TREE', coordinates: [10.1965, 76.3858], timestamp: '09:50' },
      [res2.incident!]
    );
    expect(res3.accepted).toBe(true);
    expect(res3.escalated).toBe(true);
    expect(res3.incident?.verificationStatus).toBe('CORROBORATED');
    expect(res3.incident?.confidence).toBe('HIGH');
    expect(res3.incident?.reportCount).toBe(3);
  });

  // C5.2: Anti-abuse rate limiter rejects spam (> 3 reports in 10 minutes)
  it('C5.2: Anti-abuse rate limiter rejects 4th submission from same driver within 10 minutes', () => {
    const driverId = 'DRV-SPAMMER';
    const now = Date.now();

    expect(validateDriverRateLimit(driverId, now)).toBe(true);
    expect(validateDriverRateLimit(driverId, now + 1000)).toBe(true);
    expect(validateDriverRateLimit(driverId, now + 2000)).toBe(true);

    // 4th report should be blocked
    expect(validateDriverRateLimit(driverId, now + 3000)).toBe(false);

    const spamAttempt = ingestDriverReport(
      { driverId, type: 'ACCIDENT', coordinates: [10.0, 76.0], timestamp: '10:00' },
      [],
      now + 4000
    );
    expect(spamAttempt.accepted).toBe(false);
    expect(spamAttempt.rejectionReason).toContain('Rate limit exceeded');
  });

  // C5.3: Duplicate submission from same driver on same hazard is rejected
  it('C5.3: Duplicate report from same driver on existing hazard is rejected', () => {
    const coords: [number, number] = [10.1960, 76.3860];
    const res1 = ingestDriverReport(
      { driverId: 'DRV-SAME', type: 'FALLEN_TREE', coordinates: coords, timestamp: '10:00' },
      []
    );

    const dupAttempt = ingestDriverReport(
      { driverId: 'DRV-SAME', type: 'FALLEN_TREE', coordinates: coords, timestamp: '10:02' },
      [res1.incident!]
    );

    expect(dupAttempt.accepted).toBe(false);
    expect(dupAttempt.rejectionReason).toContain('Duplicate report');
  });

  // C6: Matching logic unit tests
  it('C6.1: areReportsMatching correctly handles distance, time, and type compatibility', () => {
    // Matching within 1.5km and 30m
    const match = areReportsMatching(
      'FALLEN_TREE',
      [10.1960, 76.3860],
      '10:10',
      'ROAD_BLOCKED',
      [10.1980, 76.3870],
      '10:20'
    );
    expect(match).toBe(true);

    // Far away (> 5km)
    const farMatch = areReportsMatching(
      'FALLEN_TREE',
      [10.1960, 76.3860],
      '10:10',
      'FALLEN_TREE',
      [10.3500, 76.5000],
      '10:20'
    );
    expect(farMatch).toBe(false);

    // Time difference > 30 min
    const staleMatch = areReportsMatching(
      'FALLEN_TREE',
      [10.1960, 76.3860],
      '09:00',
      'FALLEN_TREE',
      [10.1960, 76.3860],
      '10:10'
    );
    expect(staleMatch).toBe(false);
  });

  it('C6.2: Impact engine correctly computes report age', () => {
    const r1 = CANONICAL_ROUTES.find((r) => r.id === 'R1')!;
    const tripAtChalakudy: Trip = {
      ...CANONICAL_PRIMARY_TRIP,
      currentPosition: [10.3070, 76.3330],
    };

    // Incident at 10:10, current time 10:17 -> Report age should be 7 minutes
    const impact = evaluateTripImpact(tripAtChalakudy, r1, CANONICAL_INCIDENT_1042, '10:17');
    expect(impact.reportAgeMin).toBe(7);
  });

  it('C6.3: Impact engine formats concise driver alert message', () => {
    const r1 = CANONICAL_ROUTES.find((r) => r.id === 'R1')!;
    const impact = evaluateTripImpact(CANONICAL_PRIMARY_TRIP, r1, CANONICAL_INCIDENT_1042, '10:17');

    expect(impact.driverAlertMessage).toContain('ROUTE DISRUPTION DETECTED');
    expect(impact.driverAlertMessage).toContain('24.0 km ahead');
    expect(impact.driverAlertMessage).toContain('23 min');
    expect(impact.driverAlertMessage).toContain('PERISHABLE');
  });

  it('C6.4: Incident confidence explanation formats properly for driver reports', () => {
    const singleDriverInc: Incident = {
      id: 'INC-9999',
      type: 'FLOODED_ROAD',
      typeLabel: 'Flooded Road',
      locationName: 'Aluva',
      coordinates: [10.10, 76.35],
      timestamp: '09:30',
      severity: 'MEDIUM',
      source: 'DRIVER_REPORT',
      sourceLabel: 'Driver Report',
      sourceDriverId: 'DRV-77',
      verificationStatus: 'UNVERIFIED',
      confidence: 'LOW',
      confidenceScore: 0.45,
      description: 'Water on road',
      affectedRouteIds: ['R1'],
      status: 'ACTIVE',
      reportCount: 1,
    };

    const exp = getConfidenceExplanation(singleDriverInc);
    expect(exp).toContain('Single driver submission');
    expect(exp).toContain('UNVERIFIED');
    expect(exp).toContain('45%');
  });
});
