import React from 'react';
import { Activity, CloudRain, Radio, Wifi, WifiOff } from 'lucide-react';
import { useLogisticsStore } from '../../store/useLogisticsStore';

export const DataStatusChip: React.FC = () => {
  const { routingStatus, weatherStatus, isNetworkOnline, isSyncing, lastSyncTime } = useLogisticsStore();

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Network Online/Offline Pill */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono transition ${
          isNetworkOnline
            ? isSyncing
              ? 'bg-sky-950/80 border-sky-600/50 text-sky-300 animate-pulse'
              : 'bg-emerald-950/80 border-emerald-600/40 text-emerald-300'
            : 'bg-rose-950/90 border-rose-600/60 text-rose-300'
        }`}
      >
        {isNetworkOnline ? (
          isSyncing ? (
            <>
              <Radio className="w-3 h-3 text-sky-400 animate-spin" />
              <span>SYNCING...</span>
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>ONLINE</span>
            </>
          )
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-rose-400" />
            <span>OFFLINE (Last sync: {lastSyncTime})</span>
          </>
        )}
      </div>

      {/* OSRM Status */}
      <div
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-mono ${
          routingStatus.isLive
            ? 'bg-slate-900 border-sky-600/50 text-sky-300'
            : 'bg-slate-900 border-amber-600/40 text-amber-300'
        }`}
        title={routingStatus.isLive ? 'Live OSRM Routing Active' : 'Offline Route Snapshot Active'}
      >
        <Activity className={`w-3 h-3 ${routingStatus.isLive ? 'text-sky-400' : 'text-amber-400'}`} />
        <span>OSRM: {routingStatus.isLive ? 'LIVE' : 'SNAPSHOT'}</span>
      </div>

      {/* Weather Status */}
      <div
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-mono ${
          weatherStatus.isLive
            ? 'bg-slate-900 border-sky-600/50 text-sky-300'
            : 'bg-slate-900 border-amber-600/40 text-amber-300'
        }`}
        title={weatherStatus.isLive ? 'Live Open-Meteo Weather Feed' : 'Offline Weather Snapshot Active'}
      >
        <CloudRain className={`w-3 h-3 ${weatherStatus.isLive ? 'text-sky-400' : 'text-amber-400'}`} />
        <span>WEATHER: {weatherStatus.isLive ? 'LIVE' : 'SNAPSHOT'}</span>
      </div>
    </div>
  );
};
