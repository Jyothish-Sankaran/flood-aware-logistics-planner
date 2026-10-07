import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLogisticsStore } from '../store/useLogisticsStore';
import { CargoCategory, VehicleType, VehicleProfile, CANONICAL_ROUTES } from '../scenario/scenario';
import { classifyCargoText, getCargoPriorityDetails, buildCargoProfile } from '../engines/cargoClassifier';
import { evaluateRoutes, RouteRecommendationResult } from '../engines/routeEngine';
import { fetchCorridorWeather } from '../services/weather';

export const TripWizard: React.FC = () => {
  const navigate = useNavigate();
  const { incidents, addAuditLog, setSelectedRouteId } = useLogisticsStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Cargo State
  const [cargoName, setCargoName] = useState('Fresh Vegetables');
  const [cargoCategory, setCargoCategory] = useState<CargoCategory>('PERISHABLE');
  const [cargoWeightKg, setCargoWeightKg] = useState(500);
  const [cargoValueRs, setCargoValueRs] = useState(60000);
  const [requiredDeliveryTime, setRequiredDeliveryTime] = useState('12:00');
  const [specialHandling, setSpecialHandling] = useState('Temperature controlled (4-8°C), time-sensitive perishable goods');
  const [freeTextPrompt, setFreeTextPrompt] = useState('500 kg fresh tomatoes, deliver by 2 PM');
  const [nlpClassified, setNlpClassified] = useState(false);

  // Step 2: Vehicle State
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('REFRIGERATED_TRUCK');
  const [driverName, setDriverName] = useState('Arun');
  const [driverPhone, setDriverPhone] = useState('+91 98470 12345');

  // Step 3: Route State
  const [originCity, setOriginCity] = useState('Palakkad');
  const [destinationCity, setDestinationCity] = useState('Kochi');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RouteRecommendationResult | null>(null);
  const [selectedRouteChoice, setSelectedRouteChoice] = useState<'R1' | 'R2' | 'R3'>('R1');
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  // Available vehicles
  const vehicleOptions: { type: VehicleType; name: string; capacityKg: number; description: string }[] = [
    {
      type: 'REFRIGERATED_TRUCK',
      name: 'Refrigerated Truck (Cold-Chain)',
      capacityKg: 1500,
      description: 'Active compressor unit; optimal for fresh produce, pharmaceuticals & dairy.',
    },
    {
      type: 'MINI_TRUCK',
      name: 'Mini Truck (Lighter Freight)',
      capacityKg: 1000,
      description: 'Compact 4-wheeler for urban navigation and quick regional runs.',
    },
    {
      type: 'LORRY',
      name: 'Medium Freight Lorry (Standard)',
      capacityKg: 4000,
      description: 'Standard 6-wheeler for dry FMCG, packaged goods, and general transport.',
    },
    {
      type: 'HEAVY_TRUCK',
      name: 'Heavy Multi-Axle Truck',
      capacityKg: 16000,
      description: 'Heavy transport. Subject to bridge clearance & narrow corridor restrictions.',
    },
  ];

  const currentVehicleSpec = vehicleOptions.find((v) => v.type === selectedVehicleType)!;
  const isOverweight = cargoWeightKg > currentVehicleSpec.capacityKg;

  // Handle Free-Text NLP Classification
  const handleClassifyText = () => {
    const result = classifyCargoText(freeTextPrompt);
    setCargoCategory(result.category);
    if (result.extractedWeightKg) setCargoWeightKg(result.extractedWeightKg);
    if (result.extractedDeliveryTime) setRequiredDeliveryTime(result.extractedDeliveryTime);
    setCargoName(result.category === 'PERISHABLE' ? 'Fresh Tomatoes' : freeTextPrompt.slice(0, 30));
    setNlpClassified(true);
  };

  const priorityDetails = getCargoPriorityDetails(cargoCategory);

  // Run Step 3 Route Risk & Scoring Analysis
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    const weatherRes = await fetchCorridorWeather(true);

    const cargoProfile = buildCargoProfile(
      cargoName,
      cargoCategory,
      cargoWeightKg,
      cargoValueRs,
      requiredDeliveryTime,
      specialHandling
    );

    const vehicleProfile: VehicleProfile = {
      id: selectedVehicleType === 'REFRIGERATED_TRUCK' ? 'VH-104' : 'VH-301',
      name: currentVehicleSpec.name,
      type: selectedVehicleType,
      driver: driverName,
      driverPhone: driverPhone,
      capacityKg: currentVehicleSpec.capacityKg,
    };

    setTimeout(() => {
      const results = evaluateRoutes(
        CANONICAL_ROUTES,
        cargoProfile,
        vehicleProfile,
        weatherRes.waypoints,
        incidents
      );
      setAnalysisResult(results);
      setSelectedRouteChoice(results.recommendedRoute.route.id);
      setIsAnalyzing(false);
    }, 1200);
  };

  // Dispatch Trip
  const handleDispatchTrip = () => {
    setSelectedRouteId(selectedRouteChoice);
    addAuditLog({
      eventType: 'TRIP_CREATED',
      title: `New Trip Created: ${cargoName}`,
      description: `Origin: ${originCity} -> Destination: ${destinationCity} | Vehicle: ${currentVehicleSpec.name} | Route: ${selectedRouteChoice}`,
      actor: 'Dispatcher',
      details: {
        cargo: cargoName,
        category: cargoCategory,
        weightKg: cargoWeightKg,
        valueRs: cargoValueRs,
        routeId: selectedRouteChoice,
      },
    });

    navigate('/');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Wizard Header & Stepper */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Create Cargo-Aware Logistics Trip
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Classify cargo priority, configure vehicle constraints, and analyze flood-resilient route options.
            </p>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-2 text-xs">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold ${
                step === 1 ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>1. Cargo</span>
            </div>
            <div className="w-4 h-0.5 bg-slate-800"></div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold ${
                step === 2 ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>2. Vehicle</span>
            </div>
            <div className="w-4 h-0.5 bg-slate-800"></div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold ${
                step === 3 ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>3. Route AI</span>
            </div>
          </div>
        </div>

        {/* STEP 1: CARGO CLASSIFICATION */}
        {step === 1 && (
          <div className="pt-6 space-y-6">
            {/* Free-Text NLP Classifier Box */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Free-Text Cargo AI Prompt (English, Malayalam or Manglish)
                </label>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-700">
                  NLP Classifier
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={freeTextPrompt}
                  onChange={(e) => setFreeTextPrompt(e.target.value)}
                  placeholder="e.g. 500 kg fresh tomatoes, deliver by 2 PM to Ernakulam"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleClassifyText}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Classify</span>
                </button>
              </div>

              {nlpClassified && (
                <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded-lg text-xs text-cyan-300 flex items-center justify-between">
                  <span>✓ Automatically classified as <strong>{priorityDetails.categoryLabel}</strong> ({cargoWeightKg} kg, Target: {requiredDeliveryTime})</span>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-cyan-800 text-cyan-400 font-mono">
                    Rule-based template
                  </span>
                </div>
              )}
            </div>

            {/* Standard Form Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Cargo Item Name</label>
                <input
                  type="text"
                  value={cargoName}
                  onChange={(e) => setCargoName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Cargo Category</label>
                <select
                  value={cargoCategory}
                  onChange={(e) => {
                    const cat = e.target.value as CargoCategory;
                    setCargoCategory(cat);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="PERISHABLE">Perishable Goods (Vegetables, Dairy, Fish)</option>
                  <option value="MEDICAL">Medical Supplies & Pharmaceuticals</option>
                  <option value="HIGH_VALUE">High-Value Consignment (Electronics, Gold)</option>
                  <option value="HEAVY_MACHINERY">Heavy Machinery & Oversized Load</option>
                  <option value="GENERAL">General Freight & Dry Goods</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Consignment Weight (kg)</label>
                <input
                  type="number"
                  value={cargoWeightKg}
                  onChange={(e) => setCargoWeightKg(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Total Cargo Value (₹ INR)</label>
                <input
                  type="number"
                  value={cargoValueRs}
                  onChange={(e) => setCargoValueRs(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Required Arrival ETA</label>
                <input
                  type="text"
                  value={requiredDeliveryTime}
                  onChange={(e) => setRequiredDeliveryTime(e.target.value)}
                  placeholder="e.g. 12:00 or 2:00 PM"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Special Handling Instructions</label>
                <input
                  type="text"
                  value={specialHandling}
                  onChange={(e) => setSpecialHandling(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            {/* AI Transportation Priority Card */}
            <div className="p-4 bg-gradient-to-r from-slate-950 to-slate-900 border-2 border-cyan-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-xs text-white">AI TRANSPORTATION PRIORITY SPECIFICATION</span>
                </div>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-700">
                  {priorityDetails.sourceBadge}
                </span>
              </div>

              <div className="text-base font-black text-amber-300">
                PRIMARY PRIORITY: {priorityDetails.primaryPriority}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {priorityDetails.priorityDescription}
              </p>

              {/* Weight Sensitivity Badges */}
              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-700 text-slate-300">
                  Delay Sensitivity: <strong className="text-amber-400">{(priorityDetails.weightWeights.delaySensitivity * 100).toFixed(0)}%</strong>
                </span>
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-700 text-slate-300">
                  Flood Sensitivity: <strong className="text-cyan-400">{(priorityDetails.weightWeights.floodSensitivity * 100).toFixed(0)}%</strong>
                </span>
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-700 text-slate-300">
                  Road Quality: <strong className="text-slate-200">{(priorityDetails.weightWeights.roadQualitySensitivity * 100).toFixed(0)}%</strong>
                </span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-2"
              >
                <span>Continue to Vehicle Selection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: VEHICLE PROFILE */}
        {step === 2 && (
          <div className="pt-6 space-y-6">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">Select Transport Vehicle Profile</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {vehicleOptions.map((veh) => {
                  const isSelected = veh.type === selectedVehicleType;
                  return (
                    <div
                      key={veh.type}
                      onClick={() => setSelectedVehicleType(veh.type)}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-cyan-950/50 border-cyan-500 shadow-md shadow-cyan-950/40'
                          : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-white">{veh.name}</span>
                        <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded text-cyan-300 border border-slate-700">
                          Cap: {veh.capacityKg.toLocaleString()} kg
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{veh.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Capacity Overload Warning */}
            {isOverweight && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-600 rounded-xl text-xs text-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-100">Vehicle Overload Warning Detected</div>
                  <p className="text-[11px] text-rose-300 mt-0.5">
                    Cargo weight ({cargoWeightKg} kg) exceeds the maximum rated payload ({currentVehicleSpec.capacityKg} kg) of this {currentVehicleSpec.name}. Please select a larger vehicle or reduce cargo volume.
                  </p>
                </div>
              </div>
            )}

            {/* Driver Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assigned Driver Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Driver Contact Phone</label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(3);
                  handleStartAnalysis();
                }}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-2"
              >
                <span>Analyze Routes & Disruption Risk</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ROUTE INTELLIGENCE & SCORING */}
        {step === 3 && (
          <div className="pt-6 space-y-6">
            {/* Origin & Destination Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Origin City (Kerala)</label>
                <select
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Palakkad">Palakkad (Agrarian Hub)</option>
                  <option value="Thrissur">Thrissur</option>
                  <option value="Kozhikode">Kozhikode</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Destination City</label>
                <select
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Kochi">Kochi Port / Commercial Hub</option>
                  <option value="Alappuzha">Alappuzha</option>
                  <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                </select>
              </div>
            </div>

            {/* Loading / Analyzing State */}
            {isAnalyzing ? (
              <div className="p-12 text-center space-y-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <div className="font-bold text-sm text-white">ANALYZING CANDIDATE ROUTES...</div>
                  <p className="text-xs text-slate-400">
                    Evaluating live weather squalls, 2018/2019 flood basin overlaps, road quality, and vehicle suitability...
                  </p>
                </div>
              </div>
            ) : analysisResult ? (
              <div className="space-y-6">
                {/* Explainable AI Recommendation Hero Card */}
                <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 border-cyan-500 rounded-xl shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-xs text-cyan-300">EXPLAINABLE LOGISTICS RECOMMENDATION</span>
                    </div>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-700">
                      {analysisResult.explanation.sourceBadge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    {analysisResult.explanation.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {analysisResult.explanation.summary}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    {analysisResult.explanation.detailedReasoning.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Score Breakdown Accordion */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
                    >
                      {showScoreBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{showScoreBreakdown ? 'Hide Weighted Score Breakdown' : 'Audit Weighted Score Breakdown & Formula'}</span>
                    </button>

                    {showScoreBreakdown && (
                      <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] space-y-2">
                        <div className="text-slate-400 font-mono">
                          Formula: Penalty = (Delay * W_delay) + (Flood * W_flood) + (Road * W_road) + (Vehicle * W_veh)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono">
                          {analysisResult.evaluatedRoutes.map((er) => (
                            <div key={er.route.id} className="p-2 bg-slate-900 rounded border border-slate-800">
                              <div className="font-bold text-white">{er.route.id}: Overall Penalty {er.overallScore}</div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                Duration: {er.scoreBreakdown.durationPenalty} (w={er.scoreBreakdown.durationWeight})<br />
                                Flood Risk: {er.scoreBreakdown.floodPenalty} (w={er.scoreBreakdown.floodWeight})<br />
                                Road Quality: {er.scoreBreakdown.roadPenalty} (w={er.scoreBreakdown.roadWeight})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Candidate Route Cards */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-300">Select Dispatch Route</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {analysisResult.evaluatedRoutes.map((er) => {
                      const isSelected = er.route.id === selectedRouteChoice;
                      const isBlocked = er.riskAssessment.isBlocked;

                      return (
                        <div
                          key={er.route.id}
                          onClick={() => !isBlocked && setSelectedRouteChoice(er.route.id)}
                          className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                            isBlocked
                              ? 'bg-rose-950/20 border-rose-800/50 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/20 shadow-xl cursor-pointer'
                              : 'bg-slate-950 border-slate-800 hover:bg-slate-900/60 cursor-pointer'
                          }`}
                        >
                          <div className="space-y-2.5">
                            {/* Role Badges */}
                            <div className="flex flex-wrap gap-1">
                              {er.roleBadges.map((badge) => (
                                <span
                                  key={badge}
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${
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
                              <div className="font-bold text-xs text-white">{er.route.name}</div>
                              <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{er.route.description}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800 font-mono">
                              <div>
                                <span className="text-slate-400 text-[10px]">Distance:</span>
                                <div className="font-bold text-white">{er.route.distanceKm} km</div>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px]">Duration:</span>
                                <div className="font-bold text-white">{er.route.durationMinutes} min</div>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px]">Arrival ETA:</span>
                                <div className="font-bold text-cyan-300">{er.route.eta}</div>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px]">Flood Index:</span>
                                <div className={`font-bold ${er.riskAssessment.floodRiskScore > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {er.riskAssessment.floodRiskScore}/100
                                </div>
                              </div>
                            </div>

                            {er.vehicleSuitabilityWarning && (
                              <div className="p-1.5 bg-amber-950/60 border border-amber-600/60 rounded text-[10px] text-amber-200">
                                ⚠️ {er.vehicleSuitabilityWarning}
                              </div>
                            )}
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-mono">Penalty Score: <strong>{er.overallScore}</strong></span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isSelected ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>
                              {isSelected ? 'SELECTED' : 'SELECT'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Vehicles</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDispatchTrip}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg transition flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dispatch Trip on Route {selectedRouteChoice}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
