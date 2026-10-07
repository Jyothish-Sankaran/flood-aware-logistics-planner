import React from 'react';
import {
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const KnownLimitationsPage: React.FC = () => {
  const limitations = [
    {
      id: 'LIM-01',
      title: 'Historical Static Flood Polygons (Illustrative)',
      currentLimitation:
        'Flood vulnerability is computed using curated static GeoJSON polygons derived from 2018/2019 Kerala flood records, multiplied by live rainfall.',
      honestFraming:
        'Does not yet ingest live river water-level gauging sensors or dynamic reservoir dam shutter discharge telemetry.',
      roadmapDeliverable:
        'Direct API integration with Central Water Commission (CWC) and KSDMA dam discharge telemetry grids to dynamically expand inundation buffers.',
    },
    {
      id: 'LIM-02',
      title: 'Simulated Emergency Authority Feed',
      currentLimitation:
        'Authority road closure incidents are generated via an in-memory adapter interface (SimulatedAuthoritySource).',
      honestFraming:
        'No official state-level live government API currently exists for real-time fallen tree or police road closure feeds.',
      roadmapDeliverable:
        'Production webhooks directly interfacing with Kerala Police 112 CAD (Computer Aided Dispatch) and Fire & Rescue emergency logs.',
    },
    {
      id: 'LIM-03',
      title: 'Heuristic Delay Probability Scoring',
      currentLimitation:
        'Disruption delay probability is calculated using multi-attribute rule matrices rather than a trained neural network.',
      honestFraming:
        'Heuristic models are transparent and auditable but cannot capture subtle temporal traffic patterns.',
      roadmapDeliverable:
        'Trained XGBoost regression model utilizing 3 years of anonymized Kerala commercial vehicle GPS trajectories paired with IMD weather logs.',
    },
    {
      id: 'LIM-04',
      title: 'Offline Mode Cannot Detect Brand-New External Incidents',
      currentLimitation:
        'During cellular outages, the driver app relies strictly on pre-cached routes, prior incidents, and known flood zones.',
      honestFraming:
        'Offline mode explicitly announces cached status and never falsely claims to discover newly created server hazards.',
      roadmapDeliverable:
        'Peer-to-peer (P2P) Bluetooth Mesh and Wi-Fi Direct protocol allowing nearby trucks on the same corridor to exchange hazard telemetry without cellular towers.',
    },
    {
      id: 'LIM-05',
      title: 'English-Primary Interface Localization',
      currentLimitation:
        'UI elements and system notifications are currently rendered in English, with Malayalam support restricted to NLP keyword parsing.',
      honestFraming:
        'Rural lorry drivers require full native language voice synthesis for hands-free navigation.',
      roadmapDeliverable:
        'Full Malayalam UI localization, WhatsApp interactive dispatch bot, and Malayalam voice synthesis via IBM watsonx / Bhashini API.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl font-bold text-white">What This Prototype Does Not Do (Yet)</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Honest engineering disclosures, prototype scope boundaries, and post-hackathon pilot roadmap.
        </p>
      </div>

      {/* Limitations Grid */}
      <div className="space-y-4">
        {limitations.map((item) => (
          <div
            key={item.id}
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                  {item.id}
                </span>
                <h2 className="text-sm font-bold text-white">{item.title}</h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Scope Boundary</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-400 text-[11px] block">Current Prototype Reality:</span>
                <p className="text-slate-300 leading-relaxed">{item.currentLimitation}</p>
                <div className="text-[11px] text-amber-300/90 italic pt-1 border-t border-slate-800/80">
                  ⚠️ {item.honestFraming}
                </div>
              </div>

              <div className="space-y-1.5 p-3.5 bg-cyan-950/20 rounded-xl border border-cyan-800/50">
                <span className="font-bold text-cyan-300 text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Roadmap Production Deliverable:</span>
                </span>
                <p className="text-slate-200 leading-relaxed">{item.roadmapDeliverable}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
