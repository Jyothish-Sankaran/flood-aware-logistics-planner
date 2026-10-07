import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  FastForward,
  Sliders,
  ChevronUp,
  ChevronDown,
  Wifi,
  WifiOff,
  TreePine,
} from 'lucide-react';
import { useLogisticsStore } from '../../store/useLogisticsStore';

export const DemoControlsFloating: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const {
    currentStepIndex,
    timelineSteps,
    advanceTimelineStep,
    setDemoStep,
    resetDemo,
    playbackSpeed,
    setPlaybackSpeed,
    isNetworkOnline,
    setNetworkOnline,
    triggerAuthorityIncident,
  } = useLogisticsStore();

  // Keyboard shortcut listener (1..9 for steps, 'r' for reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= '1' && e.key <= '6') {
        const stepNum = parseInt(e.key, 10) - 1;
        setDemoStep(stepNum);
      } else if (e.key === 'r' || e.key === 'R') {
        resetDemo();
      } else if (e.key === 'n' || e.key === 'N') {
        advanceTimelineStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDemoStep, resetDemo, advanceTimelineStep]);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-full font-sans transition-all duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="px-3.5 py-2.5 bg-slate-800/80 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-xs text-white">DEMO CONTROLS</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-1.5 py-0.2 rounded border border-cyan-800">
              Keys 1-6
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white rounded transition"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="p-3.5 space-y-3 text-xs">
            {/* Quick Actions Bar */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => advanceTimelineStep()}
                disabled={currentStepIndex >= timelineSteps.length - 1}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-md transition"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Next Step (N)</span>
              </button>

              <button
                onClick={() => resetDemo()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                title="Reset back to 09:00 start (Key: R)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Scripted 4-Min Demo Timeline
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {timelineSteps.map((step, idx) => {
                  const isActive = idx === currentStepIndex;
                  return (
                    <button
                      key={step.time}
                      onClick={() => setDemoStep(idx)}
                      className={`w-full text-left p-2 rounded-lg border transition flex items-start gap-2 ${
                        isActive
                          ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200'
                          : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      <span className="font-mono text-[10px] px-1 bg-slate-800 rounded text-slate-300 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white truncate">{step.title}</span>
                          <span className="font-mono text-[10px] text-cyan-400">{step.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{step.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Simulation Shortcuts */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-1.5">
              <button
                onClick={() => triggerAuthorityIncident()}
                className="flex items-center justify-center gap-1.5 p-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-600/50 text-rose-300 rounded text-[10px] font-semibold transition"
              >
                <TreePine className="w-3 h-3 text-rose-400" />
                <span>Simulate Tree Fall</span>
              </button>

              <button
                onClick={() => setNetworkOnline(!isNetworkOnline)}
                className={`flex items-center justify-center gap-1.5 p-1.5 border rounded text-[10px] font-semibold transition ${
                  isNetworkOnline
                    ? 'bg-amber-950/60 hover:bg-amber-900 border-amber-600/50 text-amber-300'
                    : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-600/50 text-emerald-300'
                }`}
              >
                {isNetworkOnline ? (
                  <>
                    <WifiOff className="w-3 h-3 text-amber-400" />
                    <span>Drop Network</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    <span>Restore Network</span>
                  </>
                )}
              </button>
            </div>

            {/* Speed Control */}
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Playback Speed:</span>
              <div className="flex gap-1">
                {[1, 2, 5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      playbackSpeed === spd
                        ? 'bg-cyan-600 border-cyan-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
