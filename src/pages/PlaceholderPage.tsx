import React from 'react';

export const PlaceholderPage: React.FC<{ title: string; phase: string }> = ({ title, phase }) => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center space-y-3">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="text-xs text-slate-400">Scheduled for implementation in <span className="font-mono text-cyan-400">{phase}</span>.</p>
        <div className="inline-block px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700">
          Module Boundary Configured & Active
        </div>
      </div>
    </div>
  );
};
