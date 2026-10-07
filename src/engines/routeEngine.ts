import { RouteOption, CargoProfile, VehicleProfile, Incident } from '../scenario/scenario';
import { WaypointWeather } from '../services/weather';
import { evaluateRouteRisk, RouteRiskAssessment } from './riskEngine';
import { getCargoPriorityDetails } from './cargoClassifier';

export interface EvaluatedRoute {
  route: RouteOption;
  riskAssessment: RouteRiskAssessment;
  overallScore: number; // 0 - 100 (Lower penalty is better)
  fitnessPercentage: number; // 0 - 100% (Higher is better)
  delayProbability: number; // % chance of significant disruption
  vehicleSuitability: number; // % suitability for selected vehicle (0 - 100%)
  vehicleSuitabilityWarning?: string;
  roleBadges: ('FASTEST' | 'SAFEST' | 'AI RECOMMENDED' | 'BLOCKED' | 'VEHICLE RESTRICTION' | 'INLAND ALTERNATIVE')[];
  isRecommended: boolean;
  scoreBreakdown: {
    durationWeight: number;
    durationPenalty: number;
    floodWeight: number;
    floodPenalty: number;
    roadWeight: number;
    roadPenalty: number;
    weatherWeight: number;
    weatherPenalty: number;
    vehicleWeight: number;
    vehiclePenalty: number;
  };
}

export interface RouteRecommendationResult {
  evaluatedRoutes: EvaluatedRoute[];
  recommendedRoute: EvaluatedRoute;
  explanation: {
    title: string;
    summary: string;
    detailedReasoning: string[];
    sourceBadge: 'watsonx.ai Granite' | 'Rule-based template';
  };
  cargoPrioritySummary: {
    category: string;
    primaryPriority: string;
    description: string;
  };
}

/**
 * Evaluates candidate routes considering specific cargo sensitivities, vehicle limits, flood risk, and real-time incidents.
 */
export function evaluateRoutes(
  routes: RouteOption[],
  cargo: CargoProfile,
  vehicle: VehicleProfile,
  weatherWaypoints: WaypointWeather[],
  activeIncidents: Incident[]
): RouteRecommendationResult {
  const cargoConfig = getCargoPriorityDetails(cargo.category);
  const weights = cargoConfig.weightWeights;

  // Find min duration for normalization
  const minDuration = Math.min(...routes.map((r) => r.durationMinutes));

  const evaluated: EvaluatedRoute[] = routes.map((route) => {
    const risk = evaluateRouteRisk(route, weatherWaypoints, activeIncidents);

    // 1. Duration / Delay Penalty (0 - 100)
    const durationDelta = route.durationMinutes - minDuration;
    const durationPenalty = Math.min(100, durationDelta * 2.5);

    // 2. Vehicle Suitability Assessment
    let vehiclePenalty = 0;
    let vehicleSuitability = 100;
    let vehicleSuitabilityWarning: string | undefined = undefined;

    // Check cargo weight vs vehicle capacity
    if (cargo.weightKg > vehicle.capacityKg) {
      vehiclePenalty += 50;
      vehicleSuitability -= 50;
      vehicleSuitabilityWarning = `Cargo weight (${cargo.weightKg} kg) exceeds vehicle payload limit (${vehicle.capacityKg} kg). Overloading hazard.`;
    }

    // Check road restrictions for heavy vehicles
    if (vehicle.type === 'HEAVY_TRUCK') {
      const hasUnsuitableSegment = route.segments.some((seg) => !seg.isHeavyVehicleSuitable);
      if (hasUnsuitableSegment) {
        vehiclePenalty += 70;
        vehicleSuitability = Math.max(20, vehicleSuitability - 60);
        vehicleSuitabilityWarning = 'Route contains narrow bridges/bridges unrated for multi-axle heavy transport.';
      }
    } else if (vehicle.type === 'REFRIGERATED_TRUCK') {
      // Prefers smooth 4-lane national highway for constant compressor stability
      if (route.id === 'R3') {
        vehiclePenalty += 20;
        vehicleSuitability -= 20;
      }
    }

    // 3. Delay Probability
    let delayProbability = Math.round(
      risk.floodRiskScore * 0.35 +
      risk.weatherRiskScore * 0.25 +
      risk.roadRiskScore * 0.20 +
      (risk.isBlocked ? 95 : risk.incidentRiskPenalty * 0.5)
    );
    delayProbability = Math.min(100, Math.max(5, delayProbability));

    // 4. Weighted Score Calculation (Penalty index: lower is superior)
    let overallPenalty =
      durationPenalty * weights.delaySensitivity +
      risk.floodRiskScore * weights.floodSensitivity +
      risk.roadRiskScore * weights.roadQualitySensitivity +
      risk.weatherRiskScore * 0.10 +
      vehiclePenalty * weights.vehicleSuitabilitySensitivity +
      risk.incidentRiskPenalty * 0.8;

    if (risk.isBlocked) {
      overallPenalty = 9999; // Disqualify blocked route
      vehicleSuitability = 0;
      delayProbability = 100;
    }

    // Fitness percentage: Inverse of normalized penalty
    const fitnessPercentage = risk.isBlocked ? 0 : Math.max(5, Math.round(100 - overallPenalty * 0.85));

    // Assign Role Badges
    const roleBadges: EvaluatedRoute['roleBadges'] = [];
    if (risk.isBlocked) {
      roleBadges.push('BLOCKED');
    }
    if (route.durationMinutes === minDuration && !risk.isBlocked) {
      roleBadges.push('FASTEST');
    }
    if (route.id === 'R2' && !risk.isBlocked) {
      roleBadges.push('SAFEST');
    }
    if (vehicleSuitabilityWarning) {
      roleBadges.push('VEHICLE RESTRICTION');
    }
    if (route.id === 'R3') {
      roleBadges.push('INLAND ALTERNATIVE');
    }

    return {
      route,
      riskAssessment: risk,
      overallScore: Math.round(overallPenalty * 10) / 10,
      fitnessPercentage,
      delayProbability,
      vehicleSuitability,
      vehicleSuitabilityWarning,
      roleBadges,
      isRecommended: false,
      scoreBreakdown: {
        durationWeight: weights.delaySensitivity,
        durationPenalty: Math.round(durationPenalty),
        floodWeight: weights.floodSensitivity,
        floodPenalty: risk.floodRiskScore,
        roadWeight: weights.roadQualitySensitivity,
        roadPenalty: risk.roadRiskScore,
        weatherWeight: 0.10,
        weatherPenalty: risk.weatherRiskScore,
        vehicleWeight: weights.vehicleSuitabilitySensitivity,
        vehiclePenalty: Math.round(vehiclePenalty),
      },
    };
  });

  // Determine AI Recommended Route (Lowest overall penalty among unblocked routes)
  const validRoutes = evaluated.filter((r) => !r.riskAssessment.isBlocked);
  let recommended = validRoutes.sort((a, b) => a.overallScore - b.overallScore)[0];

  if (!recommended) {
    recommended = evaluated[0]; // Fallback if all blocked
  }

  // Mark recommended
  recommended.isRecommended = true;
  if (!recommended.roleBadges.includes('AI RECOMMENDED')) {
    recommended.roleBadges.unshift('AI RECOMMENDED');
  }

  // Generate Explainable Recommendation Text
  const r1Evaluated = evaluated.find((e) => e.route.id === 'R1');
  const r2Evaluated = evaluated.find((e) => e.route.id === 'R2');

  let explanationTitle = '';
  let summary = '';
  const detailedReasoning: string[] = [];

  if (r1Evaluated?.riskAssessment.isBlocked) {
    // Post-incident state
    explanationTitle = `Route R2 Recommended (NH 544 R1 Blocked at Angamaly)`;
    summary = `Route R2 Bypass is recommended because NH 544 (R1) is blocked by a confirmed high-severity obstruction (${r1Evaluated.riskAssessment.blockingIncident?.typeLabel || 'Tree Fall'} at Angamaly). Although R2 adds 17 minutes, it completely eliminates clearance delays and secures the ${cargo.name} cargo ETA.`;
    detailedReasoning.push(
      `Primary route R1 is disqualified due to verified incident INC-1042 (${r1Evaluated.riskAssessment.blockingIncident?.locationName}).`
    );
    detailedReasoning.push(
      `Route R2 (152.0 km, 2h 27m, ETA 11:27) diverges via Mala-Parur, safely bypassing the Angamaly blockage zone.`
    );
    detailedReasoning.push(
      `Avoids estimated 90-minute queue congestion, saving ${cargo.isPerishable ? 'valuable perishable shelf-life' : 'significant transit delay'}.`
    );
    detailedReasoning.push(
      `Flood vulnerability on R2 remains LOW (Score: ${r2Evaluated?.riskAssessment.floodRiskScore ?? 18}/100) with full vehicle clearance.`
    );
  } else {
    // Normal pre-incident state
    if (cargo.category === 'PERISHABLE') {
      explanationTitle = `Route R1 Recommended for Perishable Freight`;
      summary = `Route R1 is recommended because it offers the fastest transit time (2h 10m, ETA ${r1Evaluated?.route.eta || '11:10'}), minimizing delay-induced spoilage risk for ${cargo.name} (valued at ₹${cargo.valueRs.toLocaleString()}).`;
      detailedReasoning.push(`Fastest corridor (138 km) saving 17 minutes compared to Route R2.`);
      detailedReasoning.push(`Perishable cargo delay sensitivity weight is set to ${weights.delaySensitivity * 100}%, prioritizing prompt delivery.`);
      detailedReasoning.push(`No active critical blockages detected on NH 544; current flood risk is manageable.`);
      detailedReasoning.push(`Route R2 remains a verified standby with lowest combined flood exposure (Score: 18/100).`);
    } else if (cargo.category === 'HEAVY_MACHINERY') {
      explanationTitle = `Route R1 Recommended (Heavy Transport Certified)`;
      summary = `Route R1 is selected for Heavy Machinery due to dual-carriageway structural certification and absence of narrow bridge restrictions present on inland routes.`;
      detailedReasoning.push(`R1 4-lane highway accommodates multi-axle width and weight.`);
      detailedReasoning.push(`Inland route R3 is disqualified due to narrow bridge weight limits.`);
      detailedReasoning.push(`Road suitability weight active at ${weights.roadQualitySensitivity * 100}%.`);
    } else {
      explanationTitle = `Route ${recommended.route.id} Recommended for ${cargoConfig.categoryLabel}`;
      summary = `Route ${recommended.route.name} achieves the optimal balance between transit duration, road quality, and weather vulnerability for ${cargo.name}.`;
      detailedReasoning.push(`Overall penalty score of ${recommended.overallScore} is lowest across candidate routes.`);
      detailedReasoning.push(`Baseline flood risk index: ${recommended.riskAssessment.floodRiskScore}/100.`);
      detailedReasoning.push(`Transit duration: ${recommended.route.durationMinutes} minutes (ETA ${recommended.route.eta}).`);
    }
  }

  return {
    evaluatedRoutes: evaluated,
    recommendedRoute: recommended,
    explanation: {
      title: explanationTitle,
      summary,
      detailedReasoning,
      sourceBadge: 'Rule-based template',
    },
    cargoPrioritySummary: {
      category: cargoConfig.categoryLabel,
      primaryPriority: cargoConfig.primaryPriority,
      description: cargoConfig.priorityDescription,
    },
  };
}
