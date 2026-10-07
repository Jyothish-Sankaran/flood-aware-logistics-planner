import React from 'react';
import {
  Layers,
  Database,
  Cpu,
  Shield,
  Sparkles,
  Truck,
  Code,
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-bold text-white">System Architecture & Pipeline Specification</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Modular, auditable, and offline-resilient architecture powering the Kerala Flood-Aware Logistics Planner.
        </p>
      </div>

      {/* End-to-End Pipeline Visualization Flow */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          End-to-End Logistics Decision Flow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-slate-900 text-cyan-400 px-2 py-0.5 rounded border border-slate-700">
                LAYER 01
              </span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-xs font-bold text-white">Data Ingestion Layer</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Fetches OpenStreetMap geometries via OSRM, Open-Meteo precipitation feeds, curated flood zones (2018/2019 records), and incident adapter streams.
            </p>
            <div className="text-[10px] text-emerald-400 font-mono">✓ Zero-Key Snapshot Fallback</div>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-slate-900 text-purple-400 px-2 py-0.5 rounded border border-slate-700">
                LAYER 02
              </span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-xs font-bold text-white">Incident & Confidence</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Deduplicates and corroborates multi-driver hazard submissions (1 driver = UNVERIFIED, 3+ = CORROBORATED, Authority = VERIFIED) with rate-limit spam protection.
            </p>
            <div className="text-[10px] text-purple-300 font-mono">✓ Anti-Abuse Rate Limiter</div>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-slate-900 text-amber-400 px-2 py-0.5 rounded border border-slate-700">
                LAYER 03
              </span>
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-xs font-bold text-white">Risk & Route Scoring</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Calculates flood risk ($Zone \times RainMultiplier$), road quality, and cargo-weighted penalty matrices (Perishable = Delay focus; Heavy Machinery = Road focus).
            </p>
            <div className="text-[10px] text-amber-300 font-mono">✓ 100% Deterministic Math</div>
          </div>

          {/* Step 4 */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-slate-900 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">
                LAYER 04
              </span>
              <Truck className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-xs font-bold text-white">Impact, Reroute & SOS</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Evaluates polyline collision (&lt;500m), computes distance ahead & time-to-impact, delivers driver alert dialog, and executes instant rerouting to Route R2 Bypass.
            </p>
            <div className="text-[10px] text-emerald-300 font-mono">✓ Offline Queueing Support</div>
          </div>
        </div>
      </div>

      {/* Pluggable Adapter Documentation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-cyan-400" />
          Pluggable Adapter Interface (`IncidentSource`)
        </h2>

        <p className="text-xs text-slate-300 leading-relaxed">
          LDSS isolates incident ingestion behind an extensible adapter pattern. Real government feeds (Kerala Police Traffic Feeds, Fire & Rescue CAD, and KSDMA emergency streams) can plug in directly without altering any core scoring or impact calculation engines.
        </p>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre>{`// /src/adapters/IncidentSource.ts
export interface IncidentSource {
  sourceId: string;
  sourceType: 'AUTHORITY' | 'DRIVER' | 'CITIZEN';
  sourceName: string;
  fetchIncidents(): Promise<Incident[]>;
  subscribe(onIncident: (incident: Incident) => void): () => void;
}

// Example Implementation for Kerala Police Traffic API:
export class KeralaPoliceTrafficAdapter implements IncidentSource {
  sourceId = 'SRC-KERALA-POLICE';
  sourceType = 'AUTHORITY';
  sourceName = 'Kerala State Police Traffic Control Room Feed';

  async fetchIncidents(): Promise<Incident[]> {
    const response = await fetch('https://api.keralapolice.gov.in/traffic/incidents');
    const records = await response.json();
    return records.map(this.normalizePoliceRecord);
  }
}`}</pre>
        </div>
      </div>
    </div>
  );
};
