import React from 'react';
import { Activity, ShieldCheck, Database, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800/80 bg-[#090D17] text-gray-400 py-8 mt-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold tracking-tight uppercase text-sm">
              <Activity className="w-4 h-4 text-blue-400" />
              CITY PULSE
            </div>
            <p className="text-gray-400 text-xs leading-relaxed max-w-md">
              A high-precision live civic health dashboard delivering real-time, deterministic observations for monitored urban areas.
            </p>
            <p className="text-[11px] text-gray-500 font-mono">
              Live Civic Health Dashboard · Jaipur, Delhi, Mumbai
            </p>
          </div>

          <div>
            <span className="text-gray-300 font-semibold uppercase tracking-wider text-[11px] block mb-2">
              Data & Methodology
            </span>
            <ul className="space-y-1 text-[11px] text-gray-400">
              <li className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-blue-400" />
                Open-Meteo Air Quality API
              </li>
              <li className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" />
                Open-Meteo Weather API
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                U.S. EPA AQI Standard (PM2.5)
              </li>
            </ul>
          </div>

          <div>
            <span className="text-gray-300 font-semibold uppercase tracking-wider text-[11px] block mb-2">
              Coverage & Quality
            </span>
            <ul className="space-y-1 text-[11px] text-gray-400">
              <li className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-gray-400" />
                Jaipur, Delhi, Mumbai
              </li>
              <li>Status: Zero-Fabrication Pipeline</li>
              <li>Deterministic Cross-Feed Logic</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} City Pulse. Live Civic Health Dashboard. Monitored civic metrics are based on empirical sensor observations.
          </div>
          <div className="font-mono text-[10px]">
            Civic Platform · Production Ready
          </div>
        </div>
      </div>
    </footer>
  );
}
