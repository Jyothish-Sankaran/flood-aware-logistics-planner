import React from 'react';
import {
  Shield,
  UserCheck,
  Eye,
  Lock,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { AuditLogDrawer } from '../components/audit/AuditLogDrawer';

export const ResponsibleAIPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-bold text-white">Responsible AI, Governance & Safety Architecture</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Rigorous ethical AI safeguards, human-in-the-loop control, anti-abuse defenses, and privacy guarantees.
        </p>
      </div>

      {/* 4 Pillars of Responsible AI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Human-in-the-Loop */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <UserCheck className="w-5 h-5" />
            <h2>1. Human-in-the-Loop Decision Governance</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The AI never autonomously redirects or overrides a vehicle's route. Rerouting requires affirmative confirmation by either the active driver or dispatch manager.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Driver retains absolute discretion to accept or dismiss reroute suggestions.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Immutable audit logs record every dispatcher authorization and driver response.</span>
            </li>
          </ul>
        </div>

        {/* Pillar 2: Uncertainty Quantification */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <Eye className="w-5 h-5" />
            <h2>2. Uncertainty & Data Freshness Quantification</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every route evaluation, incident record, and weather forecast explicitly declares its confidence score (HIGH / MEDIUM / LOW) and data age.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span>Offline mode displays persistent warnings and never claims to detect live events.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span>Transparent "Why this confidence?" audit drawers on all incident cards.</span>
            </li>
          </ul>
        </div>

        {/* Pillar 3: Bias & Abuse Controls */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <h2>3. Multi-Driver Corroboration & Anti-Abuse</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            To prevent malicious reporting, prank road blockages, or traffic manipulation:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Single driver reports remain UNVERIFIED until corroborated by 2+ independent drivers.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Rate limiting restricts drivers to a maximum of 3 submissions per 10 minutes.</span>
            </li>
          </ul>
        </div>

        {/* Pillar 4: Privacy & Data Minimization */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Lock className="w-5 h-5" />
            <h2>4. Privacy Protection & Zero-Monetization</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Driver telemetry and live coordinates are visible only to the authorized fleet manager during active trips.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>No continuous background location tracking outside of active scheduled trips.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Zero driver personal identifiable data (PID) sold to third parties or advertisers.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Third Party Disclosures & Licenses */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <FileCheck className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Third-Party Open Data & Open Source Disclosures</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-white block">OpenStreetMap</span>
            <span className="text-slate-400 text-[10px]">ODbL License © OpenStreetMap contributors</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-white block">OSRM Routing Engine</span>
            <span className="text-slate-400 text-[10px]">BSD-2-Clause License</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-white block">Open-Meteo Weather</span>
            <span className="text-slate-400 text-[10px]">CC BY 4.0 Open Meteorological Data</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-white block">Leaflet GIS Engine</span>
            <span className="text-slate-400 text-[10px]">BSD-2-Clause Open Source</span>
          </div>
        </div>
      </div>

      {/* Embedded Live Audit Log Drawer */}
      <AuditLogDrawer />
    </div>
  );
};
