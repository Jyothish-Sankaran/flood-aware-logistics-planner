import React, { useEffect } from 'react';
import { KeralaMap } from '../components/map/KeralaMap';
import { useLogisticsStore } from '../store/useLogisticsStore';
import {
  Truck,
  Shield,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TreePine,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchCorridorRoutes } from '../services/routing';
import { fetchCorridorWeather } from '../services/weather';

export const ManagerDashboard: React.FC = () => {
  const {
    primaryTrip,
    secondaryTrip,
    incidents,
    activeAlertTrip104,
    suppressedAlertsCount,
    setRoutingStatus,
    setWeatherStatus,
    triggerAuthorityIncident,
    acceptRerouteTrip104,
  } = useLogisticsStore();

  useEffect(() => {
    // In background, probe routing and weather to populate live/snapshot status chips
    fetchCorridorRoutes().then((res) => {
      setRoutingStatus({ isLive: res.isLive, source: res.source });
    });
    fetchCorridorWeather().then((res) => {
      setWeatherStatus({ isLive: res.isLive, source: res.source });
    });
  }, [setRoutingStatus, setWeatherStatus]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Alert if Critical Disruption Detected */}
      {activeAlertTrip104 && (
        <div className="bg-rose-950/90 border-2 border-rose-600 rounded-xl p-4 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-600 rounded-lg text-white font-bold">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-rose-900 border border-rose-500 font-mono px-2 py-0.5 rounded font-bold">
                  HIGH SEVERITY DISRUPTION
                </span>
                <span className="text-xs text-rose-300 font-mono">
                  {activeAlertTrip104.incident.id} • {activeAlertTrip104.incident.locationName}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                Route R1 Blocked {activeAlertTrip104.distanceAheadKm} km ahead of Vehicle VH-104 (TRIP-104)
              </h3>
              <p className="text-xs text-rose-200 mt-0.5">
                Time-to-impact: <span className="font-bold underline">{activeAlertTrip104.timeToImpactMin} minutes</span>. Cargo: Perishable Fresh Vegetables (Rs 60,000). Reroute to Bypass R2 recommended.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => acceptRerouteTrip104()}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg transition flex items-center justify-center gap-2 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Authorize Reroute (R2)</span>
            </button>
            <Link
              to="/incident-center"
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-xs font-semibold"
            >
              Details
            </Link>
          </div>
        </div>
      )}

      {/* Corridor Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Fleet</span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">2 <span className="text-xs font-normal text-slate-400">vehicles</span></div>
          <div className="text-[11px] text-emerald-400 font-medium mt-0.5">VH-104 & VH-208 Monitored</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Corridor Incidents</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{incidents.length} <span className="text-xs font-normal text-slate-400">active</span></div>
          <div className="text-[11px] text-amber-300 font-medium mt-0.5">1 Verified Blockage</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Alert Intelligence</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{suppressedAlertsCount} <span className="text-xs font-normal text-slate-400">suppressed</span></div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Off-route noise filtered</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Decision Strategy</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1">Cargo-Aware</div>
          <div className="text-[11px] text-purple-300 font-medium mt-0.5">Flood & Vehicle Adapted</div>
        </div>
      </div>

      {/* Main Map & Live Corridor View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Live Kerala Corridor GIS Map</h2>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                NH 544 & State Bypass
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => triggerAuthorityIncident()}
                className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-900 border border-rose-600/50 text-rose-300 rounded font-semibold text-[11px] flex items-center gap-1 transition"
              >
                <TreePine className="w-3 h-3 text-rose-400" />
                <span>Simulate Authority Incident</span>
              </button>
            </div>
          </div>

          <div className="h-[520px]">
            <KeralaMap />
          </div>
        </div>

        {/* Active Trip Telemetry & Live Cards */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center justify-between">
            <span>Active Trips</span>
            <Link to="/active-monitoring" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </h2>

          {/* Primary Trip VH-104 Card */}
          <div
            className={`p-4 rounded-xl border transition ${
              primaryTrip.status === 'CRITICAL'
                ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/50'
                : primaryTrip.status === 'REROUTED'
                ? 'bg-emerald-950/30 border-emerald-500/60'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${primaryTrip.status === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-cyan-400'}`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">{primaryTrip.vehicle.name}</div>
                  <div className="text-[10px] text-slate-400">{primaryTrip.id} • Driver {primaryTrip.vehicle.driver}</div>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  primaryTrip.status === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                    : primaryTrip.status === 'REROUTED'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-sky-950 text-sky-300 border-sky-600'
                }`}
              >
                {primaryTrip.status}
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Cargo:</span>
                <span className="font-semibold text-emerald-300">{primaryTrip.cargo.name} (500 kg, Rs 60k)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Priority:</span>
                <span className="font-semibold text-amber-300">PERISHABLE • MINIMIZE DELAY</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Active Route:</span>
                <span className="font-mono text-cyan-300 font-bold">{primaryTrip.activeRouteId}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">ETA:</span>
                <span className="font-mono font-bold text-white">{primaryTrip.currentEta}</span>
              </div>

              {/* Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Palakkad</span>
                  <span>{primaryTrip.currentProgressPercent}% (Near Chalakudy)</span>
                  <span>Kochi</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      primaryTrip.status === 'CRITICAL' ? 'bg-rose-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${primaryTrip.currentProgressPercent}%` }}
                  ></div>
                </div>
              </div>

              {primaryTrip.status === 'CRITICAL' && (
                <div className="pt-2">
                  <button
                    onClick={() => acceptRerouteTrip104()}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authorize Reroute to R2 Bypass</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Trip VH-208 Card */}
          <div className="p-4 rounded-xl border bg-slate-900/90 border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-800 text-sky-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">{secondaryTrip.vehicle.name}</div>
                  <div className="text-[10px] text-slate-400">{secondaryTrip.id} • Driver {secondaryTrip.vehicle.driver}</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                SAFE
              </span>
            </div>

            <div className="space-y-1.5 text-slate-300 pt-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Cargo:</span>
                <span className="text-sky-300 font-semibold">{secondaryTrip.cargo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Route:</span>
                <span className="font-mono text-slate-200">Thrissur - Kochi via Bypass (R2)</span>
              </div>
              <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80 text-[11px] text-slate-400 italic">
                ✓ Angamaly incident INC-1042 does not intersect this vehicle's remaining corridor. Alert suppressed.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
