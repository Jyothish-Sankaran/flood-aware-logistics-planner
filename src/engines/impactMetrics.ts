import { DEMO_METRICS } from '../scenario/scenario';

export interface ImpactAssumptions {
  cargoValueRs: number;
  spoilageRatePerHour: number; // e.g. 0.12 (12%/hr)
  fuelCostPerKmRs: number;
  idleCostPerHourRs: number;
  expectedQueueMinutes: number;
}

export interface ComputedTripImpactMetrics {
  blockageWaitAvoidedMinutes: number;
  avoidedDelayHours: number;
  spoilageCostAvoidedRs: number;
  idleCostSavedRs: number;
  additionalFuelCostRs: number;
  netFinancialSavingsRs: number;
  alertsSuppressedCount: number;
  rerouteDelayMinutes: number;
  hasCitations: boolean;
  citationNotes: string;
}

/**
 * Computes live operational & financial savings for a rerouted trip based on stated assumptions.
 */
export function computeImpactMetrics(
  assumptions: ImpactAssumptions,
  isRerouted: boolean = true,
  distanceDeltaKm: number = 14.0, // 152 km (R2) - 138 km (R1) = 14 km
  reroutePenaltyMinutes: number = DEMO_METRICS.REROUTE_DELAY_PENALTY_MIN // 17 min
): ComputedTripImpactMetrics {
  if (!isRerouted) {
    return {
      blockageWaitAvoidedMinutes: 0,
      avoidedDelayHours: 0,
      spoilageCostAvoidedRs: 0,
      idleCostSavedRs: 0,
      additionalFuelCostRs: 0,
      netFinancialSavingsRs: 0,
      alertsSuppressedCount: 2,
      rerouteDelayMinutes: 0,
      hasCitations: false,
      citationNotes: 'Baseline run. No active reroute executed.',
    };
  }

  // 1. Avoided Blockage Wait
  const blockageWaitAvoidedMinutes = Math.max(
    0,
    assumptions.expectedQueueMinutes - reroutePenaltyMinutes
  );
  const avoidedDelayHours = blockageWaitAvoidedMinutes / 60.0;

  // 2. Avoided Spoilage (Perishable cargo loss prevented)
  const spoilageCostAvoidedRs = Math.round(
    avoidedDelayHours * assumptions.spoilageRatePerHour * assumptions.cargoValueRs
  );

  // 3. Operational Idle Cost Saved (Engine idling in traffic queue)
  const idleCostSavedRs = Math.round(
    avoidedDelayHours * assumptions.idleCostPerHourRs
  );

  // 4. Additional Fuel for Longer Distance (14 km extra on R2)
  const additionalFuelCostRs = Math.round(
    distanceDeltaKm * assumptions.fuelCostPerKmRs
  );

  // 5. Total Net Value Created
  const netFinancialSavingsRs =
    spoilageCostAvoidedRs + idleCostSavedRs - additionalFuelCostRs;

  return {
    blockageWaitAvoidedMinutes,
    avoidedDelayHours: Math.round(avoidedDelayHours * 100) / 100,
    spoilageCostAvoidedRs,
    idleCostSavedRs,
    additionalFuelCostRs,
    netFinancialSavingsRs,
    alertsSuppressedCount: 2,
    rerouteDelayMinutes: reroutePenaltyMinutes,
    hasCitations: false,
    citationNotes: 'Estimate based on stated assumptions.',
  };
}
