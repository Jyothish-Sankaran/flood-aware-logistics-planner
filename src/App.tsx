import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/common/Header';
import { DemoControlsFloating } from './components/demo/DemoControlsFloating';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { TripWizard } from './pages/TripWizard';
import { RouteIntelligence } from './pages/RouteIntelligence';
import { ActiveMonitoring } from './pages/ActiveMonitoring';
import { IncidentCenter } from './pages/IncidentCenter';
import { DriverApp } from './pages/DriverApp';
import { ImpactAnalytics } from './pages/ImpactAnalytics';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { ReadinessPage } from './pages/ReadinessPage';
import { ResponsibleAIPage } from './pages/ResponsibleAIPage';
import { KnownLimitationsPage } from './pages/KnownLimitationsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white pb-20">
        <Header />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ManagerDashboard />} />
            <Route path="/create-trip" element={<TripWizard />} />
            <Route path="/route-intelligence" element={<RouteIntelligence />} />
            <Route path="/active-monitoring" element={<ActiveMonitoring />} />
            <Route path="/incident-center" element={<IncidentCenter />} />
            <Route path="/driver" element={<DriverApp />} />
            <Route path="/impact" element={<ImpactAnalytics />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/readiness" element={<ReadinessPage />} />
            <Route path="/responsible-ai" element={<ResponsibleAIPage />} />
            <Route path="/limitations" element={<KnownLimitationsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Demo Controls Floating Panel */}
        <DemoControlsFloating />
      </div>
    </BrowserRouter>
  );
};
