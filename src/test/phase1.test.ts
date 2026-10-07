import { describe, it, expect } from 'vitest';
import { CANONICAL_ROUTES, CANONICAL_PRIMARY_TRIP, VehicleProfile } from '../scenario/scenario';
import { classifyCargoText, getCargoPriorityDetails, buildCargoProfile } from '../engines/cargoClassifier';
import { evaluateRouteRisk } from '../engines/riskEngine';
import { evaluateRoutes } from '../engines/routeEngine';
import { fetchCorridorWeather } from '../services/weather';

describe('Phase 1 Acceptance Tests: Cargo, Vehicle, Risk Engine & Route Scoring', () => {
  // B1: NLP classification of "500 kg fresh tomatoes, deliver by 2 PM"
  it('B1: Classifies "500 kg fresh tomatoes, deliver by 2 PM" as PERISHABLE with MINIMIZE DELAY priority', () => {
    const text = '500 kg fresh tomatoes, deliver by 2 PM';
    const result = classifyCargoText(text);

    expect(result.category).toBe('PERISHABLE');
    expect(result.isPerishable).toBe(true);
    expect(result.extractedWeightKg).toBe(500);
    expect(result.extractedDeliveryTime).toBe('2 PM');
    expect(result.primaryPriority).toContain('MINIMIZE DELAY');
    expect(result.weightWeights.delaySensitivity).toBe(0.40);
    expect(result.sourceBadge).toBe('Rule-based template');
  });

  // B1 extension: Malayalam keyword detection
  it('B1.2: Correctly classifies Malayalam/Manglish keywords ("marunnu", "swarnam", "pachakkari")', () => {
    const medResult = classifyCargoText('emergency marunnu for ernakulam hospital');
    expect(medResult.category).toBe('MEDICAL');
    expect(medResult.primaryPriority).toContain('ROUTE RELIABILITY');

    const goldResult = classifyCargoText('swarnam parcel 10 kg');
    expect(goldResult.category).toBe('HIGH_VALUE');
    expect(goldResult.primaryPriority).toContain('MAXIMUM SAFETY');

    const vegResult = classifyCargoText('pachakkari lorry 1 ton');
    expect(vegResult.category).toBe('PERISHABLE');
    expect(vegResult.extractedWeightKg).toBe(1000);
  });

  // B2: Canonical demo trip scoring
  it('B2: Canonical demo trip evaluates R1 as FASTEST & AI RECOMMENDED, and R2 as SAFEST', async () => {
    const weather = await fetchCorridorWeather(true);
    const cargo = CANONICAL_PRIMARY_TRIP.cargo;
    const vehicle = CANONICAL_PRIMARY_TRIP.vehicle;

    const evalResult = evaluateRoutes(CANONICAL_ROUTES, cargo, vehicle, weather.waypoints, []);

    const r1 = evalResult.evaluatedRoutes.find((r) => r.route.id === 'R1')!;
    const r2 = evalResult.evaluatedRoutes.find((r) => r.route.id === 'R2')!;

    expect(r1.roleBadges).toContain('FASTEST');
    expect(r1.roleBadges).toContain('AI RECOMMENDED');
    expect(r2.roleBadges).toContain('SAFEST');
    expect(evalResult.recommendedRoute.route.id).toBe('R1');
  });

  // B3: Changing cargo category adjusts weights and penalty scores
  it('B3: Switching cargo from PERISHABLE to GENERAL or HEAVY_MACHINERY alters weighting vector', async () => {
    const weather = await fetchCorridorWeather(true);
    const vehicle = CANONICAL_PRIMARY_TRIP.vehicle;

    const perishableCargo = buildCargoProfile('Vegetables', 'PERISHABLE', 500, 60000);
    const generalCargo = buildCargoProfile('Dry Goods', 'GENERAL', 500, 60000);

    const perishableEval = evaluateRoutes(CANONICAL_ROUTES, perishableCargo, vehicle, weather.waypoints, []);
    const generalEval = evaluateRoutes(CANONICAL_ROUTES, generalCargo, vehicle, weather.waypoints, []);

    const pR1 = perishableEval.evaluatedRoutes.find((r) => r.route.id === 'R1')!;
    const gR1 = generalEval.evaluatedRoutes.find((r) => r.route.id === 'R1')!;

    // Delay sensitivity weight differs
    expect(pR1.scoreBreakdown.durationWeight).toBe(0.40);
    expect(gR1.scoreBreakdown.durationWeight).toBe(0.25);
  });

  // B4: Heavy vehicle on unsuitable segment shows restriction warning
  it('B4: Heavy vehicle profile on route R3 triggers vehicle suitability warning and penalty', async () => {
    const weather = await fetchCorridorWeather(true);
    const heavyCargo = buildCargoProfile('Turbine Assembly', 'HEAVY_MACHINERY', 10000, 5000000);
    const heavyVehicle: VehicleProfile = {
      id: 'VH-999',
      name: 'Heavy Multi-Axle Carrier',
      type: 'HEAVY_TRUCK',
      driver: 'Suresh',
      driverPhone: '+91 94470 00000',
      capacityKg: 16000,
    };

    const evalResult = evaluateRoutes(CANONICAL_ROUTES, heavyCargo, heavyVehicle, weather.waypoints, []);
    const r3 = evalResult.evaluatedRoutes.find((r) => r.route.id === 'R3')!;

    expect(r3.vehicleSuitabilityWarning).toBeDefined();
    expect(r3.vehicleSuitabilityWarning).toContain('narrow');
    expect(r3.vehicleSuitability).toBeLessThan(60);
  });

  // B4.2: Overloaded vehicle triggers overload warning
  it('B4.2: Cargo weight exceeding vehicle capacity triggers overload warning', async () => {
    const weather = await fetchCorridorWeather(true);
    const heavyCargo = buildCargoProfile('Cement Bags', 'GENERAL', 2500, 40000);
    const miniTruck: VehicleProfile = {
      id: 'VH-001',
      name: 'Mini Truck',
      type: 'MINI_TRUCK',
      driver: 'Vinod',
      driverPhone: '+91 90000 11111',
      capacityKg: 1000,
    };

    const evalResult = evaluateRoutes(CANONICAL_ROUTES, heavyCargo, miniTruck, weather.waypoints, []);
    const r1 = evalResult.evaluatedRoutes.find((r) => r.route.id === 'R1')!;

    expect(r1.vehicleSuitabilityWarning).toContain('Overloading hazard');
  });

  // B5: Explanations strictly ground on engine numbers and show provenance badge
  it('B5: Explainable recommendation uses computed numbers and includes source badge', async () => {
    const weather = await fetchCorridorWeather(true);
    const cargo = CANONICAL_PRIMARY_TRIP.cargo;
    const vehicle = CANONICAL_PRIMARY_TRIP.vehicle;

    const evalResult = evaluateRoutes(CANONICAL_ROUTES, cargo, vehicle, weather.waypoints, []);

    expect(evalResult.explanation.summary).toContain('2h 10m');
    expect(evalResult.explanation.summary).toContain('₹60,000');
    expect(evalResult.explanation.sourceBadge).toBe('Rule-based template');
    expect(evalResult.explanation.detailedReasoning.length).toBeGreaterThanOrEqual(3);
  });

  // B6: Unit tests on Risk Engine calculations
  it('B6.1: Risk engine calculates flood risk using static baseline x rainfall multiplier', async () => {
    const weather = await fetchCorridorWeather(true);
    const r1 = CANONICAL_ROUTES.find((r) => r.id === 'R1')!;
    const r2 = CANONICAL_ROUTES.find((r) => r.id === 'R2')!;

    const riskR1 = evaluateRouteRisk(r1, weather.waypoints, []);
    const riskR2 = evaluateRouteRisk(r2, weather.waypoints, []);

    expect(riskR1.floodRiskScore).toBeGreaterThan(riskR2.floodRiskScore);
    expect(riskR1.floodRiskLevel).toBeDefined();
    expect(riskR2.floodRiskLevel).toBe('LOW');
  });

  it('B6.2: Route engine disqualifies blocked route with score 9999 and BLOCKED badge', async () => {
    const weather = await fetchCorridorWeather(true);
    const blockedIncident = {
      id: 'INC-1042',
      type: 'FALLEN_TREE' as const,
      typeLabel: 'Fallen Tree',
      locationName: 'Angamaly',
      coordinates: [10.1960, 76.3860] as [number, number],
      timestamp: '10:10',
      severity: 'HIGH' as const,
      source: 'TRAFFIC_AUTHORITY' as const,
      sourceLabel: 'Traffic Police',
      verificationStatus: 'VERIFIED' as const,
      confidence: 'HIGH' as const,
      confidenceScore: 0.95,
      description: 'Blockage',
      affectedRouteIds: ['R1'] as ('R1' | 'R2' | 'R3')[],
      status: 'ACTIVE' as const,
    };

    const evalResult = evaluateRoutes(
      CANONICAL_ROUTES,
      CANONICAL_PRIMARY_TRIP.cargo,
      CANONICAL_PRIMARY_TRIP.vehicle,
      weather.waypoints,
      [blockedIncident]
    );

    const r1 = evalResult.evaluatedRoutes.find((r) => r.route.id === 'R1')!;
    expect(r1.riskAssessment.isBlocked).toBe(true);
    expect(r1.overallScore).toBe(9999);
    expect(r1.roleBadges).toContain('BLOCKED');
    expect(evalResult.recommendedRoute.route.id).toBe('R2');
  });

  it('B6.3: Cargo priority details map all 5 categories with valid weight normalization', () => {
    const categories: ('PERISHABLE' | 'MEDICAL' | 'HIGH_VALUE' | 'HEAVY_MACHINERY' | 'GENERAL')[] = [
      'PERISHABLE',
      'MEDICAL',
      'HIGH_VALUE',
      'HEAVY_MACHINERY',
      'GENERAL',
    ];

    for (const cat of categories) {
      const details = getCargoPriorityDetails(cat);
      expect(details.category).toBe(cat);
      expect(details.primaryPriority).toBeDefined();

      const totalWeight =
        details.weightWeights.delaySensitivity +
        details.weightWeights.floodSensitivity +
        details.weightWeights.roadQualitySensitivity +
        details.weightWeights.securitySensitivity +
        details.weightWeights.vehicleSuitabilitySensitivity;

      expect(totalWeight).toBeCloseTo(1.0, 2);
    }
  });
});
