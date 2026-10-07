import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { useLogisticsStore } from '../../store/useLogisticsStore';

export const AuditLogDrawer: React.FC = () => {
  const { auditLogs } = useLogisticsStore();
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    if (filterType === 'REROUTE') return log.eventType === 'REROUTE_EXECUTED';
    if (filterType === 'INCIDENT') return log.eventType === 'INCIDENT_INGESTED' || log.eventType === 'IMPACT_EVALUATED';
    if (filterType === 'EMERGENCY') return log.eventType === 'EMERGENCY_TRIGGERED';
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-base text-white">System Decision & Action Audit Log</h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Filter:</span>
          {['ALL', 'REROUTE', 'INCIDENT', 'EMERGENCY'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-2.5 py-1 rounded-lg border font-mono text-[10px] font-bold transition ${
                filterType === f
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {filteredLogs.map((log) => {
          const isReroute = log.eventType === 'REROUTE_EXECUTED';
          const isEmergency = log.eventType === 'EMERGENCY_TRIGGERED';
          const isImpact = log.eventType === 'IMPACT_EVALUATED';

          return (
            <div
              key={log.id}
              className={`p-3.5 rounded-xl border text-xs space-y-1 transition ${
                isReroute
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : isEmergency
                  ? 'bg-rose-950/30 border-rose-500/60'
                  : isImpact
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  {isReroute && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {isEmergency && <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />}
                  {log.title}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {log.timestamp} IST
                </span>
              </div>

              <p className="text-slate-300 text-[11px] leading-relaxed">{log.description}</p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                <span>Actor: <strong className="text-slate-200">{log.actor}</strong></span>
                <span>Event: {log.eventType}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
