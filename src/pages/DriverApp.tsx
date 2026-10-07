import React, { useState, useEffect } from 'react';
import {
  Truck,
  Wifi,
  WifiOff,
  AlertTriangle,
  Play,
  Pause,
  Send,
  Camera,
  CheckCircle2,
  AlertOctagon,
  Volume2,
  VolumeX,
  X,
  Sparkles,
} from 'lucide-react';
import { useLogisticsStore } from '../store/useLogisticsStore';
import { IncidentType, IncidentSeverity, Incident } from '../scenario/scenario';

export const DriverApp: React.FC = () => {
  const {
    primaryTrip,
    isNetworkOnline,
    lastSyncTime,
    isSyncing,
    activeAlertTrip104,
    acceptRerouteTrip104,
    dismissAlertTrip104,
    addIncident,
    triggerEmergency,
    voiceAlertsEnabled,
    setVoiceAlertsEnabled,
    updateGpsPosition,
    availableRoutes,
    playbackSpeed,
  } = useLogisticsStore();

  const [isDriving, setIsDriving] = useState(false);
  const [showHazardModal, setShowHazardModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hazard Report Form State
  const [hazardType, setHazardType] = useState<IncidentType>('FALLEN_TREE');
  const [hazardSeverity, setHazardSeverity] = useState<IncidentSeverity>('HIGH');
  const [hazardDescription, setHazardDescription] = useState('Maram veenu road block near bridge');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [nlpParsedType, setNlpParsedType] = useState<string | null>(null);

  // Show Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Simulated GPS movement loop
  useEffect(() => {
    if (!isDriving) return;

    const route = availableRoutes.find((r) => r.id === primaryTrip.activeRouteId) || availableRoutes[0];
    const coords = route.coordinates;

    const interval = setInterval(() => {
      const currentPercent = primaryTrip.currentProgressPercent;
      if (currentPercent >= 100) {
        setIsDriving(false);
        triggerToast('Trip completed. Arrived at destination port in Kochi.');
        return;
      }

      const nextPercent = Math.min(100, currentPercent + 2 * playbackSpeed);
      const coordIndex = Math.min(
        coords.length - 1,
        Math.floor((nextPercent / 100) * (coords.length - 1))
      );

      updateGpsPosition(coords[coordIndex], nextPercent);
    }, 1000);

    return () => clearInterval(interval);
  }, [isDriving, primaryTrip, availableRoutes, playbackSpeed, updateGpsPosition]);

  // Multilingual description NLP helper
  const handleDescriptionChange = (text: string) => {
    setHazardDescription(text);
    const lower = text.toLowerCase();
    if (lower.includes('maram') || lower.includes('tree')) {
      setHazardType('FALLEN_TREE');
      setNlpParsedType('Fallen Tree (maram)');
    } else if (lower.includes('vellam') || lower.includes('flood') || lower.includes('water')) {
      setHazardType('FLOODED_ROAD');
      setNlpParsedType('Flooded Road (vellam)');
    } else if (lower.includes('urulpottal') || lower.includes('landslide')) {
      setHazardType('LANDSLIDE');
      setNlpParsedType('Landslide (urulpottal)');
    } else if (lower.includes('block') || lower.includes('jam')) {
      setHazardType('ROAD_BLOCKED');
      setNlpParsedType('Road Blockage (block)');
    } else {
      setNlpParsedType(null);
    }
  };

  // Submit Driver Hazard
  const handleSubmitHazard = (e: React.FormEvent) => {
    e.preventDefault();

    const newHazard: Incident = {
      id: 'INC-1045',
      type: hazardType,
      typeLabel: hazardType.replace(/_/g, ' '),
      locationName: `Near ${primaryTrip.currentPosition[0].toFixed(3)}, ${primaryTrip.currentPosition[1].toFixed(3)} (Route ${primaryTrip.activeRouteId})`,
      coordinates: primaryTrip.currentPosition,
      timestamp: '10:20',
      severity: hazardSeverity,
      source: 'DRIVER_REPORT',
      sourceLabel: 'Driver Report (Arun / VH-104)',
      sourceDriverId: 'DRV-ARUN',
      verificationStatus: 'UNVERIFIED',
      confidence: 'LOW',
      confidenceScore: 0.45,
      description: hazardDescription,
      affectedRouteIds: [primaryTrip.activeRouteId],
      status: 'ACTIVE',
      reportCount: 1,
      reporters: [
        { driverId: 'DRV-ARUN', timestamp: '10:20', latLng: primaryTrip.currentPosition },
      ],
    };

    addIncident(newHazard);
    setShowHazardModal(false);

    if (!isNetworkOnline) {
      triggerToast('Hazard queued locally. Will transmit when network restores.');
    } else {
      triggerToast('HAZARD REPORTED SUCCESSFULLY. Telemetry submitted to LDSS.');
    }
  };

  // Submit Emergency SOS
  const handleTriggerEmergency = (type: 'ACCIDENT' | 'MEDICAL' | 'BREAKDOWN' | 'SECURITY', label: string) => {
    triggerEmergency(type, label);
    setShowEmergencyModal(false);

    if (!isNetworkOnline) {
      triggerToast('Emergency alert queued locally. Will transmit when signal returns.');
    } else {
      triggerToast('EMERGENCY SOS TRANSMITTED TO DISPATCH CONTROL.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-3 sm:p-4 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-cyan-600 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-cyan-300 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Device Frame */}
      <div className="bg-slate-950 border-4 border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[720px]">
        {/* Device Status Bar */}
        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between text-[11px] font-mono border-b border-slate-800 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>GPS ACTIVE</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceAlertsEnabled(!voiceAlertsEnabled)}
              className="text-slate-400 hover:text-white"
              title="Toggle Voice Alerts"
            >
              {voiceAlertsEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {/* Network Pill */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isNetworkOnline
                  ? isSyncing
                    ? 'bg-sky-950 text-sky-300 animate-pulse'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-rose-950 text-rose-300 border border-rose-700'
              }`}
            >
              {isNetworkOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>ONLINE</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-rose-400" />
                  <span>OFFLINE</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Offline Banner (Honest & Explicit) */}
        {!isNetworkOnline && (
          <div className="bg-amber-950 border-b-2 border-amber-600 px-3 py-2 text-amber-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <strong className="block text-[11px]">Live conditions unavailable. Using last synchronized information.</strong>
                <span className="text-[10px] text-amber-300/80 font-mono">Last sync: {lastSyncTime} IST</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Driver Dashboard Body */}
        <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
          {/* Top Header Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">LOGISTICS DRIVER APP</span>
                <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  {primaryTrip.vehicle.driver} ({primaryTrip.vehicle.name})
                </h2>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
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

            {/* Trip Info Card */}
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Cargo Consignment:</span>
                <span className="font-bold text-emerald-400">{primaryTrip.cargo.name} (500 kg)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Priority:</span>
                <span className="font-bold text-amber-400">PERISHABLE • MINIMIZE DELAY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Corridor:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  Route {primaryTrip.activeRouteId} ({primaryTrip.activeRouteId === 'R2' ? 'Bypass via Mala' : 'NH 544'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Arrival ETA:</span>
                <span className="font-mono text-base font-black text-white">{primaryTrip.currentEta}</span>
              </div>
            </div>

            {/* Route Progress Visual */}
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Palakkad (09:00)</span>
                <span className="text-slate-200 font-bold">{primaryTrip.currentProgressPercent}% (Chalakudy)</span>
                <span>Kochi Port</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-800 p-0.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    primaryTrip.status === 'CRITICAL' ? 'bg-rose-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${primaryTrip.currentProgressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Bottom Driver Actions */}
          <div className="space-y-2.5 pt-2">
            {/* Start / Pause GPS Simulation Button */}
            <button
              onClick={() => setIsDriving(!isDriving)}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                isDriving
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {isDriving ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isDriving ? 'PAUSE GPS TRACKING' : 'START LIVE TRIP SIMULATION'}</span>
            </button>

            {/* Report Hazard & Emergency SOS Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowHazardModal(true)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Report Hazard</span>
              </button>

              <button
                onClick={() => setShowEmergencyModal(true)}
                className="py-2.5 bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Emergency SOS</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DISRUPTION ALERT POPUP (Crucial Section 6.7 Driver Experience) */}
      {activeAlertTrip104 && isNetworkOnline && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-bounce-short">
            <div className="flex items-start justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-600 rounded-xl text-white">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-700 font-bold">
                    ROUTE DISRUPTION
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    Obstruction on NH 544
                  </h3>
                </div>
              </div>
              <button onClick={() => dismissAlertTrip104()} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-200">
              <p className="leading-relaxed">
                <strong>Tree blockage detected {activeAlertTrip104.distanceAheadKm} km ahead</strong> at {activeAlertTrip104.incident.locationName}.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                <div>Time to Impact: <strong className="text-rose-400">{activeAlertTrip104.timeToImpactMin} minutes</strong></div>
                <div>Cargo: <strong className="text-amber-400">PERISHABLE (Fresh Vegetables)</strong></div>
                <div>Recommended Alternative: <strong className="text-emerald-400">Route R2 (Bypass via Mala-Parur)</strong></div>
                <div>New ETA on R2: <strong className="text-white">11:27 (+17 min delay)</strong></div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  acceptRerouteTrip104();
                  triggerToast('Reroute confirmed. Navigating via Route R2 Bypass.');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ACCEPT REROUTE TO R2</span>
              </button>

              <button
                onClick={() => dismissAlertTrip104()}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs"
              >
                Dismiss / Keep Current Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT HAZARD MODAL */}
      {showHazardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitHazard}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Report Road Hazard</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHazardModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Hazard Description (NLP Voice / Text)</label>
              <textarea
                value={hazardDescription}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="e.g. maram veenu road block, or heavy waterlogging"
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
              {nlpParsedType && (
                <div className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3" />
                  <span>Detected keyword: {nlpParsedType}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Hazard Type</label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="FALLEN_TREE">Fallen Tree</option>
                  <option value="FLOODED_ROAD">Flooded Road</option>
                  <option value="LANDSLIDE">Landslide</option>
                  <option value="ACCIDENT">Accident</option>
                  <option value="ROAD_BLOCKED">Road Blocked</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Severity</label>
                <select
                  value={hazardSeverity}
                  onChange={(e) => setHazardSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="HIGH">HIGH (Blocked)</option>
                  <option value="MEDIUM">MEDIUM (Caution)</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            {/* Auto GPS Stamp */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
              Auto GPS: <span className="text-slate-200">{primaryTrip.currentPosition.join(', ')} (Route {primaryTrip.activeRouteId})</span>
            </div>

            {/* Photo Upload Simulation */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-dashed border-slate-700 text-center">
              <label className="cursor-pointer flex flex-col items-center gap-1 text-[11px] text-slate-400 hover:text-white">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>{photoPreview ? 'Photo Attached (Preview Active)' : 'Attach Incident Photo (Optional)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={() => setPhotoPreview('attached_mock_photo.jpg')}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowHazardModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EMERGENCY SOS MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-6 h-6 text-rose-500" />
                <h3 className="font-bold text-sm text-white">EMERGENCY SOS DISPATCH</h3>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 text-xs">
              Select emergency type to transmit immediate distress telemetry to fleet management and regional emergency response:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'ACCIDENT', label: 'Accident / Collision' },
                { type: 'MEDICAL', label: 'Medical Emergency' },
                { type: 'BREAKDOWN', label: 'Vehicle Breakdown' },
                { type: 'SECURITY', label: 'Security Threat' },
              ].map((emg) => {
                return (
                  <button
                    key={emg.type}
                    type="button"
                    onClick={() => handleTriggerEmergency(emg.type as any, emg.label)}
                    className="p-3 bg-rose-950/70 hover:bg-rose-900 border border-rose-600/70 rounded-xl text-rose-200 text-left space-y-1 transition"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <div className="font-bold text-[11px] text-white">{emg.label}</div>
                  </button>
                );
              })}
            </div>

            <div className="p-2.5 bg-slate-950 rounded-lg text-[10px] font-mono text-slate-400 space-y-0.5">
              <div>Driver: <strong>{primaryTrip.vehicle.driver}</strong></div>
              <div>Vehicle: <strong>{primaryTrip.vehicle.name}</strong></div>
              <div>GPS: <strong>{primaryTrip.currentPosition.join(', ')}</strong></div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
