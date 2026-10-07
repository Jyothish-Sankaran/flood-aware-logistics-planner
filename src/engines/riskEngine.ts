import { RouteOption, Incident } from '../scenario/scenario';
import { WaypointWeather } from '../services/weather';

export interface RouteRiskAssessment {
  routeId: 'R1' | 'R2' | 'R3';
  floodRiskScore: number; // 0 - 100
  floodRiskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  weatherRiskScore: number; // 0 - 100
  weatherRiskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  roadRiskScore: number; // 0 - 100
  roadRiskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  incidentRiskPenalty: number; // 0 - 100
  combinedRiskScore: number; // 0 - 100
  combinedRiskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  isBlocked: boolean;
  blockingIncident?: Incident;
  riskFactorsSummary: string[];
}

/**
 * Calculates comprehensive flood, weather, road, and incident risks for candidate routes.
 */
export function evaluateRouteRisk(
  route: RouteOption,
  weatherWaypoints: WaypointWeather[],
  activeIncidents: Incident[]
): RouteRiskAssessment {
  // 1. Flood Risk Calculation
  // Base vulnerability from segments
  let baseFloodScore = 15;
  if (route.id === 'R1') baseFloodScore = 42; // Passes Chalakudy & Aluva flood zones
  else if (route.id === 'R2') baseFloodScore = 18; // Western bypass avoids primary river floodplains
  else if (route.id === 'R3') baseFloodScore = 32; // Inland river crossings

  // Rainfall Multiplier based on waypoint precipitation
  const avgPrecipitation =
    weatherWaypoints.reduce((acc, wp) => acc + wp.precipitationMm, 0) /
    (weatherWaypoints.length || 1);
  const rainMultiplier = 1 + Math.min(0.5, avgPrecipitation / 50.0);
  const floodRiskScore = Math.min(100, Math.round(baseFloodScore * rainMultiplier));

  const floodRiskLevel =
    floodRiskScore > 50 ? 'HIGH' : floodRiskScore > 25 ? 'MODERATE' : 'LOW';

  // 2. Weather Risk Calculation
  const avgWind =
    weatherWaypoints.reduce((acc, wp) => acc + wp.windSpeedKmh, 0) /
    (weatherWaypoints.length || 1);
  const avgPrecipProb =
    weatherWaypoints.reduce((acc, wp) => acc + wp.precipitationProbability, 0) /
    (weatherWaypoints.length || 1);

  const weatherRiskScore = Math.min(
    100,
    Math.round(avgPrecipProb * 0.35 + avgWind * 0.45)
  );
  const weatherRiskLevel =
    weatherRiskScore > 55 ? 'HIGH' : weatherRiskScore > 30 ? 'MODERATE' : 'LOW';

  // 3. Road / Structural Risk Calculation
  let baseRoadScore = 15;
  if (route.id === 'R1') baseRoadScore = 18; // High standard 4-lane NH 544
  else if (route.id === 'R2') baseRoadScore = 24; // State highway & coastal 2-lane stretches
  else if (route.id === 'R3') baseRoadScore = 48; // Narrow bridges and single-lane stretches

  const roadRiskScore = baseRoadScore;
  const roadRiskLevel =
    roadRiskScore > 40 ? 'HIGH' : roadRiskScore > 20 ? 'MODERATE' : 'LOW';

  // 4. Incident Check & Penalty
  let incidentRiskPenalty = 0;
  let isBlocked = false;
  let blockingIncident: Incident | undefined = undefined;

  const affectingIncidents = activeIncidents.filter(
    (inc) => inc.status === 'ACTIVE' && inc.affectedRouteIds.includes(route.id)
  );

  for (const inc of affectingIncidents) {
    if (inc.verificationStatus === 'VERIFIED' && (inc.severity === 'CRITICAL' || inc.severity === 'HIGH')) {
      if (inc.type === 'FALLEN_TREE' || inc.type === 'ROAD_BLOCKED' || inc.type === 'LANDSLIDE') {
        isBlocked = true;
        blockingIncident = inc;
        incidentRiskPenalty = 100;
        break;
      }
    }

    if (inc.verificationStatus === 'CORROBORATED') {
      incidentRiskPenalty += 30;
    } else if (inc.verificationStatus === 'UNVERIFIED') {
      incidentRiskPenalty += 12;
    }
  }

  incidentRiskPenalty = Math.min(100, incidentRiskPenalty);

  // 5. Combined Risk Score
  let combinedRiskScore = Math.round(
    floodRiskScore * 0.35 + weatherRiskScore * 0.25 + roadRiskScore * 0.20 + incidentRiskPenalty * 0.20
  );

  if (isBlocked) {
    combinedRiskScore = 100;
  }

  const combinedRiskLevel =
    combinedRiskScore > 60 ? 'HIGH' : combinedRiskScore > 30 ? 'MODERATE' : 'LOW';

  // Summary bullets
  const riskFactorsSummary: string[] = [];
  if (isBlocked && blockingIncident) {
    riskFactorsSummary.push(`BLOCKED: ${blockingIncident.typeLabel} at ${blockingIncident.locationName}`);
  }
  if (floodRiskLevel === 'HIGH') {
    riskFactorsSummary.push('Elevated river floodplain inundation probability near low-lying basins.');
  } else if (floodRiskLevel === 'LOW') {
    riskFactorsSummary.push('Low flood zone intersection; robust embankment.');
  }
  if (weatherRiskScore > 40) {
    riskFactorsSummary.push(`Monsoon squalls (Avg precip: ${avgPrecipitation.toFixed(1)}mm, wind: ${avgWind.toFixed(0)} km/h).`);
  }
  if (roadRiskLevel === 'HIGH') {
    riskFactorsSummary.push('Narrow single-lane segments with heavy vehicle restrictions.');
  }

  return {
    routeId: route.id,
    floodRiskScore,
    floodRiskLevel,
    weatherRiskScore,
    weatherRiskLevel,
    roadRiskScore,
    roadRiskLevel,
    incidentRiskPenalty,
    combinedRiskScore,
    combinedRiskLevel,
    isBlocked,
    blockingIncident,
    riskFactorsSummary,
  };
}
