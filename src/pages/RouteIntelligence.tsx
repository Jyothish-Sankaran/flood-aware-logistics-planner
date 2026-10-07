import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLogisticsStore } from '../store/useLogisticsStore';
import { CargoCategory, VehicleType, CANONICAL_ROUTES } from '../scenario/scenario';
import { buildCargoProfile } from '../engines/cargoClassifier';
import { evaluateRoutes, RouteRecommendationResult } from '../engines/routeEngine';
import { fetchCorridorWeather } from '../services/weather';

export const RouteIntelligence: React.FC = () => {
  const { incidents } = useLogisticsStore();

  const [selectedCategory, setSelectedCategory] = useState<CargoCategory>('PERISHABLE');
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('REFRIGERATED_TRUCK');
  const [cargoWeightKg, setCargoWeightKg] = useState(500);
  const [cargoValueRs, setCargoValueRs] = useState(60000);
  const [evalResult, setEvalResult] = useState<RouteRecommendationResult | null>(null);
  const [showFormulaAudit, setShowFormulaAudit] = useState(false);

  useEffect(() => {
    fetchCorridorWeather(true).then((weatherRes) => {
      const cargo = buildCargoProfile(
        selectedCategory === 'PERISHABLE'
          ? 'Fresh Vegetables'
          : selectedCategory === 'MEDICAL'
          ? 'Critical Pharmaceuticals'
          : selectedCategory === 'HEAVY_MACHINERY'
          ? 'Excavator & Industrial Parts'
          : 'Standard Freight',
        selectedCategory,
        cargoWeightKg,
        cargoValueRs
      );

      const vehicle = {
        id: 'VH-104',
        name: selectedVehicleType,
        type: selectedVehicleType,
        driver: 'Arun',
        driverPhone: '+91 98470 12345',
        capacityKg: selectedVehicleType === 'HEAVY_TRUCK' ? 16000 : 1500,
      };

      const result = evaluateRoutes(
        CANONICAL_ROUTES,
        cargo,
        vehicle,
        weatherRes.waypoints,
        incidents
      );
      setEvalResult(result);
    });
  }, [selectedCategory, selectedVehicleType, cargoWeightKg, cargoValueRs, incidents]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl font-bold text-white">Route Decision Intelligence & Scoring Engine</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-factor mathematical route scoring grounded in cargo perishability, flood vulnerability, and vehicle dynamics.
            </p>
          </div>

          <span className="text-xs bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono px-3 py-1 rounded-lg">
            Deterministic & 100% Auditable
          </span>
        </div>

        {/* Interactive Experimentation Controls */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1.5">Simulate Cargo Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const cat = e.target.value as CargoCategory;
                setSelectedCategory(cat);
                if (cat === 'HEAVY_MACHINERY') {
                  setSelectedVehicleType('HEAVY_TRUCK');
                  setCargoWeightKg(8000);
                  setCargoValueRs(1500000);
                } else if (cat === 'PERISHABLE') {
                  setSelectedVehicleType('REFRIGERATED_TRUCK');
                  setCargoWeightKg(500);
                  setCargoValueRs(60000);
                }
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
            >
              <option value="PERISHABLE">Perishable Goods (High Delay Penalty)</option>
              <option value="MEDICAL">Medical Supplies (High Reliability)</option>
              <option value="HIGH_VALUE">High Value Consignment (Maximum Security)</option>
              <option value="HEAVY_MACHINERY">Heavy Machinery (Road Suitability Focus)</option>
              <option value="GENERAL">General Freight (Balanced Weights)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1.5">Vehicle Profile</label>
            <select
              value={selectedVehicleType}
              onChange={(e) => setSelectedVehicleType(e.target.value as VehicleType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
            >
              <option value="REFRIGERATED_TRUCK">Refrigerated Truck (Cold-Chain)</option>
              <option value="HEAVY_TRUCK">Heavy Multi-Axle Truck (Road Restrictions)</option>
              <option value="LORRY">Medium Freight Lorry (Standard)</option>
              <option value="MINI_TRUCK">Mini Truck</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1.5">Active Cargo Priority</label>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-bold text-amber-300 truncate">
              {evalResult?.cargoPrioritySummary.primaryPriority}
            </div>
          </div>
        </div>
      </div>

      {evalResult && (
        <div className="space-y-6">
          {/* Recommendation Hero Box */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-950 border-2 border-cyan-500 rounded-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">
                  {evalResult.explanation.title}
                </h2>
              </div>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-800">
                {evalResult.explanation.sourceBadge}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {evalResult.explanation.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {evalResult.explanation.detailedReasoning.map((reason, i) => (
                <div key={i} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            {/* Live Formula Auditor */}
            <div className="pt-2">
              <button
                onClick={() => setShowFormulaAudit(!showFormulaAudit)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5"
              >
                {showFormulaAudit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{showFormulaAudit ? 'Hide Weight Sensitivity Matrix' : 'Inspect Weight Sensitivity Matrix for this Cargo'}</span>
              </button>

              {showFormulaAudit && (
                <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-3">
                  <div className="text-slate-400">
                    Active Weight Vector for <strong>{evalResult.cargoPrioritySummary.category}</strong>:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Delay Weight:</span>
                      <div className="font-bold text-amber-300">{(evalResult.evaluatedRoutes[0].scoreBreakdown.durationWeight * 100).toFixed(0)}%</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Flood Risk Weight:</span>
                      <div className="font-bold text-cyan-300">{(evalResult.evaluatedRoutes[0].scoreBreakdown.floodWeight * 100).toFixed(0)}%</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Road Quality Weight:</span>
                      <div className="font-bold text-slate-200">{(evalResult.evaluatedRoutes[0].scoreBreakdown.roadWeight * 100).toFixed(0)}%</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Vehicle Fit Weight:</span>
                      <div className="font-bold text-emerald-300">{(evalResult.evaluatedRoutes[0].scoreBreakdown.vehicleWeight * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Route Comparison Matrix */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Full Corridor Route Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {evalResult.evaluatedRoutes.map((er) => {
                const isR = er.isRecommended;
                const isBlocked = er.riskAssessment.isBlocked;

                return (
                  <div
                    key={er.route.id}
                    className={`p-5 rounded-xl border flex flex-col justify-between ${
                      isBlocked
                        ? 'bg-rose-950/20 border-rose-800/60'
                        : isR
                        ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/20 shadow-xl'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {er.roleBadges.map((badge) => (
                          <span
                            key={badge}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                              badge === 'AI RECOMMENDED'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500'
                                : badge === 'FASTEST'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                : badge === 'SAFEST'
                                ? 'bg-teal-950 text-teal-300 border border-teal-600'
                                : badge === 'BLOCKED'
                                ? 'bg-rose-950 text-rose-300 border border-rose-600'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-white">{er.route.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{er.route.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400">Distance:</span>
                          <div className="font-bold text-white">{er.route.distanceKm} km</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Duration:</span>
                          <div className="font-bold text-white">{er.route.durationMinutes} min</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Expected ETA:</span>
                          <div className="font-bold text-cyan-300">{er.route.eta}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Flood Vulnerability:</span>
                          <div className={`font-bold ${er.riskAssessment.floodRiskScore > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {er.riskAssessment.floodRiskScore}/100 ({er.riskAssessment.floodRiskLevel})
                          </div>
                        </div>
                      </div>

                      {er.vehicleSuitabilityWarning && (
                        <div className="p-2 bg-amber-950/70 border border-amber-600/70 rounded text-[11px] text-amber-200">
                          ⚠️ {er.vehicleSuitabilityWarning}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                      <div className="text-xs font-mono">
                        <span className="text-slate-400">Penalty Score: </span>
                        <strong className={isBlocked ? 'text-rose-400' : 'text-white'}>
                          {isBlocked ? 'INVALID (BLOCKED)' : er.overallScore}
                        </strong>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded font-mono ${isR ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {isR ? 'RECOMMENDED' : 'ALTERNATIVE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
