import React, { useState } from 'react';
import {
  BookOpen,
  Database,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const ReadinessPage: React.FC = () => {
  // Cost model state
  const [fleetSize, setFleetSize] = useState<number>(25);
  const [tripsPerDay, setTripsPerDay] = useState<number>(2);

  // Dynamic cost calculations
  const totalMonthlyTrips = fleetSize * tripsPerDay * 30;
  const hostingBaseCostRs = 4500; // Dedicated VM for OSRM + App
  const weatherApiCostRs = totalMonthlyTrips > 1000 ? 1200 : 0;
  const watsonxCostRs = Math.round(totalMonthlyTrips * 0.15); // ~15 paise per classified trip
  const totalMonthlyInfrastructureCostRs = hostingBaseCostRs + weatherApiCostRs + watsonxCostRs;
  const costPerVehicleMonthRs = Math.round(totalMonthlyInfrastructureCostRs / fleetSize);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-bold text-white">Production Readiness, Scalability & Cost Model</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Technical transition plan from hackathon prototype to statewide production deployment.
        </p>
      </div>

      {/* 1. DATA & DEPENDENCIES TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Data Sources & Production Dependency Matrix</h2>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2.5 py-0.5 rounded border border-slate-700">
            Audit Checklist
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">DATA STREAM</th>
                <th className="p-3">CURRENT PROTOTYPE STATUS</th>
                <th className="p-3">ESTIMATED COST</th>
                <th className="p-3">PRODUCTION TRANSITION PLAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-3 font-semibold text-white">OpenStreetMap Basemap</td>
                <td className="p-3 text-cyan-300">CartoDB Dark Matter / OSM</td>
                <td className="p-3 font-mono">Free (Open Data)</td>
                <td className="p-3 text-slate-400">Self-hosted OpenMapTiles server on IBM Cloud or Mapbox SDK.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">OSRM Routing Engine</td>
                <td className="p-3 text-cyan-300">Public Demo Server + Snapshot</td>
                <td className="p-3 font-mono">₹2,500 / mo VM</td>
                <td className="p-3 text-slate-400">Deploy dedicated OSRM Docker instance with custom Kerala heavy-truck profiles.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Atmospheric Weather</td>
                <td className="p-3 text-cyan-300">Open-Meteo API + Snapshot</td>
                <td className="p-3 font-mono">Free / ₹1,200 commercial</td>
                <td className="p-3 text-slate-400">India Meteorological Department (IMD) API + Open-Meteo high-resolution radar.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Historical Flood Zones</td>
                <td className="p-3 text-cyan-300">Curated Static 2018/2019 Records</td>
                <td className="p-3 font-mono">Free (State Records)</td>
                <td className="p-3 text-slate-400">KSDMA GIS layer integration + Central Water Commission live dam sensor telemetry.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Incident Intelligence</td>
                <td className="p-3 text-cyan-300">Simulated Adapter Interface</td>
                <td className="p-3 font-mono">Zero licensing</td>
                <td className="p-3 text-slate-400">Direct webhook integration with Kerala Police Traffic Feeds and 112 CAD.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">IBM watsonx.ai NLP</td>
                <td className="p-3 text-cyan-300">Granite Instruct Proxy (Optional)</td>
                <td className="p-3 font-mono">Pay-as-you-go tokens</td>
                <td className="p-3 text-slate-400">Granite 13B / Granite 3 8B model deployment on IBM Cloud VPC.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. LIVE INTERACTIVE COST ESTIMATOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Production Infrastructure Cost Estimator</h2>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2.5 py-0.5 rounded border border-slate-700">
            Estimate based on stated assumptions
          </span>
        </div>

        {/* Input sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-slate-300">Active Fleet Size:</span>
              <span className="font-mono text-cyan-400 text-sm">{fleetSize} Vehicles</span>
            </div>
            <input
              type="range"
              min="5"
              max="250"
              step="5"
              value={fleetSize}
              onChange={(e) => setFleetSize(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <span className="text-[10px] text-slate-500 block">Typical mid-sized Kerala transport fleet</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-slate-300">Trips Per Vehicle / Day:</span>
              <span className="font-mono text-cyan-400 text-sm">{tripsPerDay} Trips</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={tripsPerDay}
              onChange={(e) => setTripsPerDay(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <span className="text-[10px] text-slate-500 block">Average short/medium haul runs</span>
          </div>
        </div>

        {/* Cost Summary Output */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 font-mono">
            <span className="text-slate-400 text-[11px]">Monthly Total Trips:</span>
            <div className="text-2xl font-black text-white mt-1">{totalMonthlyTrips.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">Route scoring & impact evaluations</div>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 font-mono">
            <span className="text-slate-400 text-[11px]">Total Monthly Infrastructure:</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">₹{totalMonthlyInfrastructureCostRs.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">VM + Weather API + watsonx tokens</div>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 font-mono">
            <span className="text-slate-400 text-[11px]">Cost Per Vehicle / Month:</span>
            <div className="text-2xl font-black text-cyan-400 mt-1">₹{costPerVehicleMonthRs}</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">Substantially lower than 1 single prevented delay</div>
          </div>
        </div>
      </div>

      {/* 3. SCALABILITY ROADMAP */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">3-Tier Scalability Roadmap</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
              PHASE 1: CURRENT
            </span>
            <h3 className="font-bold text-white text-sm">Palakkad - Kochi Corridor</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              NH 544 & Mala bypass corridor. Monitored for 2-5 active vehicles with static snapshot fallback.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono font-bold bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
              PHASE 2: 3-6 MONTHS
            </span>
            <h3 className="font-bold text-white text-sm">Central Kerala Grid (4 Districts)</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Ernakulam, Thrissur, Palakkad, and Alappuzha. Adds Redis-based geospatial caching & driver mesh telemetry.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
              PHASE 3: STATEWIDE
            </span>
            <h3 className="font-bold text-white text-sm">Statewide 14 Districts & High Ranges</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Full Kerala state highway network, Wayanad/Idukki ghat pass landslide models, and multi-modal waterway sync.
            </p>
          </div>
        </div>
      </div>

      {/* 4. PILOT DEPLOYMENT PLAN */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Monsoon Pilot Plan (5 Vehicles, 30 Days)</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-white">Pilot Fleet Deployment:</h4>
            <ul className="space-y-1 text-slate-300">
              <li>• 3 Refrigerated Trucks (Vegetables/Dairy from Palakkad & Wayanad)</li>
              <li>• 2 Medical Logistics Vans (Hospital deliveries Thrissur - Kochi)</li>
              <li>• Pre-installed Driver App on Android tablets with voice alerts</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white">Target Success Metrics:</h4>
            <ul className="space-y-1 text-slate-300">
              <li>• Target &gt;85% driver reroute adoption on verified disruptions</li>
              <li>• Target &gt;90% alert precision (suppressing irrelevant off-route noise)</li>
              <li>• Zero safety incidents or flood entrapments across all pilot trips</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 5. EVIDENCE & ASSUMPTIONS (With Explicit Unsourced Tags) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Evidence, Assumptions & Source Attribution</h2>
          </div>
          <span className="text-[10px] bg-amber-950 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-800">
            Integrity Guard
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Perishable Vegetables Spoilage Rate (12%/hour)</span>
              <span className="text-[10px] bg-slate-900 text-amber-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                Unsourced assumption (Heuristic default)
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Assumes temperature fluctuation value depreciation during extended roadblock queue delays in unrefrigerated or ambient transport. Editable in Settings drawer.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Expected Roadblock Queue Time (90 minutes)</span>
              <span className="text-[10px] bg-slate-900 text-amber-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                Unsourced assumption (Heuristic default)
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Estimated average time required for Fire & Rescue crews to clear a multi-lane fallen tree obstruction along NH 544.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Historical Flood Embankment Locations</span>
              <span className="text-[10px] bg-slate-900 text-emerald-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                Curated from 2018/2019 KSDMA flood reports
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Chalakudy river basin, Aluva Periyar floodplain, and Thrissur Kole lowlands mapped from official Kerala state disaster documentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
