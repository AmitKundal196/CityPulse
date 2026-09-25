import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { checkBackendHealth } from '../services/api';
import SystemStatusCard from '../components/SystemStatusCard';

export default function Dashboard() {
  const [status, setStatus] = useState('checking...');
  const [loading, setLoading] = useState(true);

  const performHealthCheck = async () => {
    setLoading(true);
    const result = await checkBackendHealth();
    if (result.online) {
      setStatus('Online');
    } else {
      setStatus('Offline');
    }
    setLoading(false);
  };

  useEffect(() => {
    performHealthCheck();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="text-center max-w-xl mb-10 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Activity className="w-4 h-4" />
          Phase 1 Foundation
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
          Neighborhood Pulse
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Real-time civic intelligence platform connecting weather, air quality, transit, and community incidents.
        </p>
      </div>

      {/* System Status Card */}
      <div className="z-10 w-full flex justify-center">
        <SystemStatusCard status={status} loading={loading} onCheck={performHealthCheck} />
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center z-10">
        <div className="inline-flex items-center gap-2 text-xs text-gray-400 bg-gray-900/60 border border-gray-800 px-4 py-2 rounded-xl backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Core Infrastructure & Graceful DB Fallback Ready</span>
        </div>
      </div>
    </div>
  );
}
