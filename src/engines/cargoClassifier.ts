import { CargoCategory, CargoProfile } from '../scenario/scenario';

export interface CargoClassificationResult {
  category: CargoCategory;
  categoryLabel: string;
  isPerishable: boolean;
  extractedWeightKg?: number;
  extractedDeliveryTime?: string;
  confidence: number; // 0.0 - 1.0
  primaryPriority: string;
  priorityDescription: string;
  weightWeights: {
    delaySensitivity: number; // 0 - 1
    floodSensitivity: number;
    roadQualitySensitivity: number;
    securitySensitivity: number;
    vehicleSuitabilitySensitivity: number;
  };
  reasoning: string;
  sourceBadge: 'watsonx.ai Granite' | 'Rule-based template';
}

const CARGO_PRIORITY_MAP: Record<
  CargoCategory,
  {
    categoryLabel: string;
    isPerishable: boolean;
    primaryPriority: string;
    priorityDescription: string;
    weightWeights: CargoClassificationResult['weightWeights'];
  }
> = {
  PERISHABLE: {
    categoryLabel: 'Perishable Goods',
    isPerishable: true,
    primaryPriority: 'MINIMIZE DELAY & SPOILAGE',
    priorityDescription:
      'Critical time-sensitivity. Maintain shortest transit duration, avoid waterlogged bottlenecks, and preserve strict arrival ETA.',
    weightWeights: {
      delaySensitivity: 0.40,
      floodSensitivity: 0.25,
      roadQualitySensitivity: 0.15,
      securitySensitivity: 0.05,
      vehicleSuitabilitySensitivity: 0.15,
    },
  },
  MEDICAL: {
    categoryLabel: 'Medical Supplies & Pharmaceuticals',
    isPerishable: false,
    primaryPriority: 'ROUTE RELIABILITY & TRANSIT CERTAINTY',
    priorityDescription:
      'High-priority health consignment. Requires zero-disruption corridors, low variance ETA, and flood-immune bypasses.',
    weightWeights: {
      delaySensitivity: 0.35,
      floodSensitivity: 0.25,
      roadQualitySensitivity: 0.15,
      securitySensitivity: 0.10,
      vehicleSuitabilitySensitivity: 0.15,
    },
  },
  HIGH_VALUE: {
    categoryLabel: 'High-Value Consignment',
    isPerishable: false,
    primaryPriority: 'MAXIMUM SAFETY & RISK AVOIDANCE',
    priorityDescription:
      'High-asset security. Avoid isolated inland stretches, known breakdown hotspots, and unverified hazards.',
    weightWeights: {
      delaySensitivity: 0.15,
      floodSensitivity: 0.25,
      roadQualitySensitivity: 0.20,
      securitySensitivity: 0.30,
      vehicleSuitabilitySensitivity: 0.10,
    },
  },
  HEAVY_MACHINERY: {
    categoryLabel: 'Heavy Machinery & Oversized Load',
    isPerishable: false,
    primaryPriority: 'ROAD SUITABILITY & BRIDGE CAPACITY',
    priorityDescription:
      'Strict geometric constraints. Multi-axle clearance, bypass narrow bridges, and avoid steep gradient roads.',
    weightWeights: {
      delaySensitivity: 0.10,
      floodSensitivity: 0.15,
      roadQualitySensitivity: 0.35,
      securitySensitivity: 0.05,
      vehicleSuitabilitySensitivity: 0.35,
    },
  },
  GENERAL: {
    categoryLabel: 'General Freight & Dry Goods',
    isPerishable: false,
    primaryPriority: 'BALANCED COST, ETA & SAFETY',
    priorityDescription:
      'Standard logistics optimization balancing highway toll, fuel consumption, distance, and baseline safety.',
    weightWeights: {
      delaySensitivity: 0.25,
      floodSensitivity: 0.25,
      roadQualitySensitivity: 0.25,
      securitySensitivity: 0.10,
      vehicleSuitabilitySensitivity: 0.15,
    },
  },
};

// Multilingual keyword dictionary (English, Malayalam transliterations, Manglish)
const KEYWORD_MAP: { category: CargoCategory; keywords: string[] }[] = [
  {
    category: 'PERISHABLE',
    keywords: [
      'tomato', 'tomatoes', 'thakkali', 'vegetable', 'vegetables', 'veggies', 'pachakkari',
      'fruit', 'fruits', 'banana', 'mango', 'fish', 'meen', 'seafood', 'prawn', 'meat', 'chicken',
      'milk', 'paal', 'dairy', 'curd', 'ice cream', 'flowers', 'pookkal', 'fresh', 'perishable'
    ],
  },
  {
    category: 'MEDICAL',
    keywords: [
      'medicine', 'medicines', 'marunnu', 'aushadham', 'pharma', 'pharmaceutical', 'vaccine',
      'vaccines', 'insulin', 'blood', 'plasma', 'hospital', 'syringe', 'oxygen', 'iv fluids',
      'medical kit', 'emergency'
    ],
  },
  {
    category: 'HIGH_VALUE',
    keywords: [
      'gold', 'swarnam', 'silver', 'jewelry', 'diamond', 'cash', 'electronics', 'laptop',
      'laptops', 'smartphone', 'smartphones', 'mobile', 'valuable', 'bullion', 'currency'
    ],
  },
  {
    category: 'HEAVY_MACHINERY',
    keywords: [
      'machinery', 'excavator', 'jcb', 'crane', 'generator', 'transformer', 'turbine',
      'steel coils', 'cement pipes', 'heavy equipment', 'iron rods', 'boiler', 'industrial machine'
    ],
  },
  {
    category: 'GENERAL',
    keywords: [
      'textile', 'clothes', 'garments', 'cloth', 'furniture', 'plastic', 'boxes', 'cartons',
      'books', 'paper', 'stationery', 'fmcg', 'soap', 'grocery', 'rice', 'ari', 'wheat', 'dry goods'
    ],
  },
];

/**
 * Classifies free-text cargo descriptions into standardized categories, priorities, and weight sensitivities.
 */
export function classifyCargoText(text: string): CargoClassificationResult {
  const normalized = text.toLowerCase();

  // Extract weight if mentioned (e.g. 500 kg, 1.5 ton, 300kg)
  let extractedWeightKg: number | undefined = undefined;
  const weightKgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilogram|kilograms)/);
  const weightTonMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:ton|tons|tonne|tonnes)/);

  if (weightKgMatch) {
    extractedWeightKg = parseFloat(weightKgMatch[1]);
  } else if (weightTonMatch) {
    extractedWeightKg = parseFloat(weightTonMatch[1]) * 1000;
  }

  // Extract delivery time if mentioned (e.g. by 2 PM, deliver by 14:00, 12:30)
  let extractedDeliveryTime: string | undefined = undefined;
  const timeMatch = normalized.match(/(?:by|deliver by|before|at)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs|hours)?)/i);
  if (timeMatch) {
    extractedDeliveryTime = timeMatch[1].trim().toUpperCase();
  }

  // Check matching keywords
  let bestCategory: CargoCategory = 'GENERAL';
  let matchedKeyword: string | null = null;
  let matchCount = 0;

  for (const group of KEYWORD_MAP) {
    for (const kw of group.keywords) {
      if (normalized.includes(kw)) {
        bestCategory = group.category;
        matchedKeyword = kw;
        matchCount++;
        break;
      }
    }
    if (matchedKeyword) break;
  }

  const priorityData = CARGO_PRIORITY_MAP[bestCategory];
  const confidence = matchedKeyword ? 0.94 : 0.65;
  const reasoning = matchedKeyword
    ? `Identified cargo indicator "${matchedKeyword}" matching ${priorityData.categoryLabel}. Configured priority to ${priorityData.primaryPriority}.`
    : 'No explicit specialty keywords detected. Assigned balanced General Freight profile.';

  return {
    category: bestCategory,
    categoryLabel: priorityData.categoryLabel,
    isPerishable: priorityData.isPerishable,
    extractedWeightKg,
    extractedDeliveryTime,
    confidence,
    primaryPriority: priorityData.primaryPriority,
    priorityDescription: priorityData.priorityDescription,
    weightWeights: priorityData.weightWeights,
    reasoning,
    sourceBadge: 'Rule-based template',
  };
}

/**
 * Returns priority specifications for an explicit CargoCategory enum value.
 */
export function getCargoPriorityDetails(category: CargoCategory): CargoClassificationResult {
  const priorityData = CARGO_PRIORITY_MAP[category];
  return {
    category,
    categoryLabel: priorityData.categoryLabel,
    isPerishable: priorityData.isPerishable,
    confidence: 1.0,
    primaryPriority: priorityData.primaryPriority,
    priorityDescription: priorityData.priorityDescription,
    weightWeights: priorityData.weightWeights,
    reasoning: `Selected ${priorityData.categoryLabel} profile with optimized logistics weighting.`,
    sourceBadge: 'Rule-based template',
  };
}

export function buildCargoProfile(
  name: string,
  category: CargoCategory,
  weightKg: number,
  valueRs: number,
  requiredDeliveryTime?: string,
  specialHandling?: string
): CargoProfile {
  return {
    name,
    category,
    weightKg,
    valueRs,
    isPerishable: category === 'PERISHABLE',
    requiredDeliveryTime,
    specialHandling,
  };
}
