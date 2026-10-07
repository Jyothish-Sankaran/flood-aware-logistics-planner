import React from 'react';
import {
  Truck,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Phone,
  AlertOctagon,
} from 'lucide-react';
import { useLogisticsStore } from '../store/useLogisticsStore';

export const ActiveMonitoring: React.FC = () => {
  const {
    primaryTrip,
    secondaryTrip,
    incidents,
    activeAlertTrip104,
    suppressedAlertsCount,
    acceptRerouteTrip104,
    triggerAuthorityIncident,
  } = useLogisticsStore();

  const isRerouted = primaryTrip.status === 'REROUTED';
  const isCritical = primaryTrip.status === 'CRITICAL';

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Active Fleet & Trip Telemetry Monitoring</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time geospatial tracking, hazard collision prediction, and automated rerouting decisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Alerts Suppressed: </span>
            <strong className="text-emerald-400">{suppressedAlertsCount}</strong>
            <span className="text-slate-500"> of {incidents.length} incidents</span>
          </div>

          <button
            onClick={() => triggerAuthorityIncident()}
            className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-600/60 text-rose-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Tree Fall on R1</span>
          </button>
        </div>
      </div>

      {/* Critical Alert Action Banner if VH-104 is in CRITICAL state */}
      {isCritical && activeAlertTrip104 && (
        <div className="p-5 bg-rose-950/90 border-2 border-rose-600 rounded-xl shadow-2xl text-white space-y-3 animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-600 rounded-lg font-black text-white">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold bg-rose-900 px-2 py-0.5 rounded border border-rose-500">
                  URGENT DISRUPTION DETECTED
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  VH-104 (TRIP-104): Blockage Detected 24.0 km Ahead on NH 544
                </h3>
                <p className="text-xs text-rose-200 mt-0.5">
                  Time-to-impact: <span className="font-bold underline">23 minutes</span> (Expected arrival ~10:40). Blockage: INC-1042 Fallen Tree at Angamaly.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => acceptRerouteTrip104()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Authorize Reroute to R2 Bypass</span>
              </button>
              <a
                href={`tel:${primaryTrip.vehicle.driverPhone}`}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Arun</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Primary Trip TRIP-104 Full Detail Card */}
      <div
        className={`p-6 rounded-2xl border transition shadow-xl ${
          isCritical
            ? 'bg-rose-950/30 border-rose-500/80 shadow-rose-950/50'
            : isRerouted
            ? 'bg-emerald-950/20 border-emerald-500/50'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isCritical ? 'bg-rose-600 text-white' : isRerouted ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-cyan-400'}`}>
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{primaryTrip.vehicle.name}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    isCritical
                      ? 'bg-rose-950 text-rose-300 border-rose-600'
                      : isRerouted
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : 'bg-sky-950 text-sky-300 border-sky-600'
                  }`}
                >
                  {primaryTrip.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trip ID: <span className="font-mono text-slate-300">{primaryTrip.id}</span> • Driver: {primaryTrip.vehicle.driver} ({primaryTrip.vehicle.driverPhone})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">CORRIDOR:</span>
              <span className="font-bold text-white">{primaryTrip.origin} ➔ {primaryTrip.destination}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">ACTIVE ROUTE:</span>
              <span className={`font-bold ${isRerouted ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {primaryTrip.activeRouteId} {isRerouted ? '(Bypass)' : '(NH 544)'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">ARRIVAL ETA:</span>
              <span className="font-bold text-white text-sm">{primaryTrip.currentEta}</span>
            </div>
          </div>
        </div>

        {/* Cargo & Telemetry Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs border-b border-slate-800">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px]">CARGO CONSIGNMENT:</span>
            <div className="font-bold text-emerald-300 mt-0.5">{primaryTrip.cargo.name}</div>
            <div className="text-[10px] text-slate-400">{primaryTrip.cargo.weightKg} kg • ₹{primaryTrip.cargo.valueRs.toLocaleString()}</div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px]">TRANSPORT PRIORITY:</span>
            <div className="font-bold text-amber-300 mt-0.5">PERISHABLE</div>
            <div className="text-[10px] text-slate-400">Primary: MINIMIZE DELAY</div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px]">CURRENT TELEMETRY GPS:</span>
            <div className="font-mono font-bold text-slate-200 mt-0.5">Near Chalakudy</div>
            <div className="text-[10px] text-slate-400 font-mono">{primaryTrip.currentPosition.join(', ')}</div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px]">DISTANCE REMAINING:</span>
            <div className="font-mono font-bold text-cyan-300 mt-0.5">{primaryTrip.remainingDistanceKm} km</div>
            <div className="text-[10px] text-slate-400">Avg Speed: 62.6 km/h</div>
          </div>
        </div>

        {/* Live Trip Progress Bar */}
        <div className="pt-4 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Palakkad (Departed 09:00)</span>
            <span className="font-semibold text-slate-200">{primaryTrip.currentProgressPercent}% Completed (Chalakudy)</span>
            <span>Kochi (ETA {primaryTrip.currentEta})</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isCritical ? 'bg-rose-500' : isRerouted ? 'bg-emerald-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${primaryTrip.currentProgressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Secondary Vehicle VH-208 Card (Unaffected by Angamaly) */}
      <div className="p-5 rounded-2xl border bg-slate-900 border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-sky-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white">{secondaryTrip.vehicle.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                  SAFE (ALERT SUPPRESSED)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trip ID: <span className="font-mono text-slate-300">{secondaryTrip.id}</span> • Driver: {secondaryTrip.vehicle.driver} ({secondaryTrip.vehicle.driverPhone})
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-300">
            Route: Thrissur ➔ Kochi via Bypass • ETA {secondaryTrip.currentEta}
          </div>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Noise Suppression Active:</strong> Incident INC-1042 (Angamaly) does not intersect this vehicle's remaining corridor. No spurious alerts transmitted to driver Rahul.
            </span>
          </div>
          <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700 font-mono text-slate-400">
            Suppressed by Impact Engine
          </span>
        </div>
      </div>
    </div>
  );
};
