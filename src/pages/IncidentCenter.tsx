import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  TreePine,
  CloudRain,
  X,
  AlertOctagon,
  Send,
} from 'lucide-react';
import { useLogisticsStore } from '../store/useLogisticsStore';
import { Incident, IncidentType, IncidentSeverity } from '../scenario/scenario';
import { getConfidenceExplanation } from '../engines/incidentEngine';

export const IncidentCenter: React.FC = () => {
  const {
    incidents,
    primaryTrip,
    triggerAuthorityIncident,
    addIncident,
    activeAlertTrip104,
  } = useLogisticsStore();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED' | 'CRITICAL' | 'AFFECTING'>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showSimModal, setShowSimModal] = useState(false);

  // Custom simulation modal fields
  const [simType, setSimType] = useState<IncidentType>('FALLEN_TREE');
  const [simLocation, setSimLocation] = useState('Angamaly Junction (NH 544)');
  const [simSeverity, setSimSeverity] = useState<IncidentSeverity>('HIGH');
  const [simDescription, setSimDescription] = useState('Large banyan tree fallen across NH 544. Road blocked.');

  // Filter logic
  const filteredIncidents = incidents.filter((inc) => {
    if (activeFilter === 'VERIFIED') return inc.verificationStatus === 'VERIFIED' || inc.verificationStatus === 'CORROBORATED';
    if (activeFilter === 'UNVERIFIED') return inc.verificationStatus === 'UNVERIFIED';
    if (activeFilter === 'CRITICAL') return inc.severity === 'CRITICAL' || inc.severity === 'HIGH';
    if (activeFilter === 'AFFECTING') return inc.id === 'INC-1042' || inc.affectedRouteIds.includes(primaryTrip.activeRouteId);
    return true;
  });

  const handleSimulateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (simType === 'FALLEN_TREE' && simLocation.includes('Angamaly')) {
      triggerAuthorityIncident();
    } else {
      const customInc: Incident = {
        id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        type: simType,
        typeLabel: simType.replace(/_/g, ' '),
        locationName: simLocation,
        coordinates: [10.1960, 76.3860], // Angamaly
        timestamp: '10:10',
        severity: simSeverity,
        source: 'TRAFFIC_AUTHORITY',
        sourceLabel: 'Kerala Traffic Police Authority',
        verificationStatus: 'VERIFIED',
        confidence: 'HIGH',
        confidenceScore: 0.98,
        description: simDescription,
        affectedRouteIds: ['R1'],
        status: 'ACTIVE',
        reportCount: 1,
      };
      addIncident(customInc);
    }
    setShowSimModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-rose-500" />
            <h1 className="text-xl font-bold text-white">Incident Intelligence Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time incident ingestion, multi-driver corroboration, and trip-level impact filtering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSimModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-lg transition flex items-center gap-1.5"
          >
            <TreePine className="w-4 h-4" />
            <span>Simulate Authority Incident</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {[
          { key: 'ALL', label: 'All Incidents' },
          { key: 'AFFECTING', label: 'Affecting Active Trips (Priority)' },
          { key: 'VERIFIED', label: 'Verified & Corroborated' },
          { key: 'UNVERIFIED', label: 'Unverified Driver Reports' },
          { key: 'CRITICAL', label: 'High & Critical Severity' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
              activeFilter === tab.key
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Incidents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-3.5">INCIDENT ID</th>
                <th className="p-3.5">TYPE</th>
                <th className="p-3.5">LOCATION</th>
                <th className="p-3.5">SEVERITY</th>
                <th className="p-3.5">SOURCE</th>
                <th className="p-3.5">VERIFICATION / CONFIDENCE</th>
                <th className="p-3.5">TRIP IMPACT</th>
                <th className="p-3.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredIncidents.map((inc) => {
                const isInc1042 = inc.id === 'INC-1042';
                const isCritical = inc.severity === 'CRITICAL' || inc.severity === 'HIGH';

                return (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className="hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="p-3.5 font-mono font-bold text-slate-200">{inc.id}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        {inc.type === 'FALLEN_TREE' && <TreePine className="w-3.5 h-3.5 text-rose-400" />}
                        {inc.type === 'FLOODED_ROAD' && <CloudRain className="w-3.5 h-3.5 text-cyan-400" />}
                        {inc.type === 'ACCIDENT' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{inc.typeLabel}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-300">{inc.locationName}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isCritical
                            ? 'bg-rose-950 text-rose-300 border border-rose-600'
                            : 'bg-amber-950 text-amber-300 border border-amber-600'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">{inc.sourceLabel}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            inc.verificationStatus === 'VERIFIED'
                              ? 'text-emerald-400'
                              : inc.verificationStatus === 'CORROBORATED'
                              ? 'text-cyan-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {inc.verificationStatus}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({inc.confidence})
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {isInc1042 && activeAlertTrip104 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-600 animate-pulse">
                          TRIP-104 (23m to impact)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">None (Suppressed)</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(inc);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail Drawer / Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-white">
                  {selectedIncident.id}: {selectedIncident.typeLabel}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 text-slate-400 hover:text-white rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                {selectedIncident.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500">Location:</span>
                  <div className="font-semibold text-slate-200">{selectedIncident.locationName}</div>
                </div>
                <div>
                  <span className="text-slate-500">Reported Timestamp:</span>
                  <div className="font-semibold text-slate-200">{selectedIncident.timestamp} IST</div>
                </div>
                <div>
                  <span className="text-slate-500">Coordinates:</span>
                  <div className="font-semibold text-slate-200">
                    {selectedIncident.coordinates[0]}, {selectedIncident.coordinates[1]}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Affected Corridors:</span>
                  <div className="font-semibold text-cyan-300">
                    {selectedIncident.affectedRouteIds.join(', ')}
                  </div>
                </div>
              </div>

              {/* WHY THIS CONFIDENCE? Box */}
              <div className="p-4 bg-gradient-to-r from-slate-950 to-slate-900 border-2 border-cyan-800 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Why this confidence? (Transparent Engine Audit)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {getConfidenceExplanation(selectedIncident)}
                </p>
                <div className="text-[10px] text-slate-500 font-mono pt-1">
                  Corroboration rule: 1 driver = UNVERIFIED (0.45) • 2 drivers = MEDIUM (0.72) • 3+ drivers = CORROBORATED (0.92) • Authority = VERIFIED (0.98)
                </div>
              </div>

              {/* Trip Impact Box if INC-1042 */}
              {selectedIncident.id === 'INC-1042' && (
                <div className="p-3.5 bg-rose-950/80 border border-rose-600 rounded-xl text-rose-200 space-y-1.5">
                  <div className="font-bold text-rose-100 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Active Disruption on TRIP-104 (Palakkad ➔ Kochi)</span>
                  </div>
                  <p className="text-[11px] text-rose-300">
                    Vehicle VH-104 is near Chalakudy, exactly <strong>24.0 km ahead</strong> of this incident. Time-to-impact is <strong>23 minutes</strong>. Automatic reroute to Route R2 Bypass recommended.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulate Custom Authority Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSimulateCustom}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TreePine className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-white">Simulate Authority Incident Injection</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Incident Type</label>
                <select
                  value={simType}
                  onChange={(e) => setSimType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="FALLEN_TREE">Fallen Tree Road Blockage</option>
                  <option value="FLOODED_ROAD">Flooded Lowland Roadway</option>
                  <option value="LANDSLIDE">Ghat Landslide</option>
                  <option value="ACCIDENT">Major Road Accident</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Location Name</label>
                <input
                  type="text"
                  value={simLocation}
                  onChange={(e) => setSimLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Severity</label>
                <select
                  value={simSeverity}
                  onChange={(e) => setSimSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="HIGH">HIGH (Severe Obstruction)</option>
                  <option value="CRITICAL">CRITICAL (Total Road Cutoff)</option>
                  <option value="MEDIUM">MEDIUM (Passable with Caution)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  value={simDescription}
                  onChange={(e) => setSimDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div><strong>Source:</strong> Kerala Traffic Police Authority (Simulated Adapter)</div>
                <div><strong>Verification:</strong> VERIFIED (Confidence HIGH 98%)</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow-lg transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Inject Incident</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
