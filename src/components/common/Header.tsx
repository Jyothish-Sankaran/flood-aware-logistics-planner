import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Navigation,
  Compass,
  AlertOctagon,
  Shield,
  Smartphone,
  BarChart3,
  BookOpen,
  Info,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DataStatusChip } from './DataStatusChip';
import { useLogisticsStore } from '../../store/useLogisticsStore';

export const Header: React.FC = () => {
  const location = useLocation();
  const { demoClock, resetDemo } = useLogisticsStore();

  const navItems = [
    { path: '/', label: 'Overview', icon: Navigation },
    { path: '/create-trip', label: 'Create Trip', icon: Compass },
    { path: '/route-intelligence', label: 'Route Intelligence', icon: Sparkles },
    { path: '/active-monitoring', label: 'Active Trips', icon: Shield },
    { path: '/incident-center', label: 'Incident Center', icon: AlertOctagon },
    { path: '/driver', label: 'Driver App', icon: Smartphone },
    { path: '/impact', label: 'Impact Analytics', icon: BarChart3 },
    { path: '/readiness', label: 'Readiness', icon: BookOpen },
    { path: '/responsible-ai', label: 'Responsible AI', icon: Shield },
    { path: '/limitations', label: 'Limitations', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800">
      {/* Top Status Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-600/30">
              L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wider text-white">LDSS KERALA</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-1.5 py-0.5 rounded border border-cyan-800">
                  GRAND CHALLENGE 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                AI-Powered Flood-Aware & Cargo-Aware Logistics Decision Support
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <DataStatusChip />

          {/* Demo Clock */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">DEMO TIME:</span>
            <span className="font-bold text-cyan-300">{demoClock} IST</span>
          </div>

          {/* Quick Reset */}
          <button
            onClick={() => resetDemo()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title="Reset demo state in <1 second"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-1 text-xs font-medium scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md whitespace-nowrap transition ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
};
