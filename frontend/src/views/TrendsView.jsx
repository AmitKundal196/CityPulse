import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Calendar,
  Clock,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useCivicData } from '../context/CivicDataContext';
import TrendChart from '../components/TrendChart';

export default function TrendsView() {
  const { activeCitiesList, trends } = useCivicData();
  const [selectedCity, setSelectedCity] = useState('Jaipur');

  const cityTrend = trends[selectedCity] || {};

  const renderTrendBadge = (direction) => {
    if (direction === 'INCREASING') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <TrendingUp className="w-3.5 h-3.5" /> Deteriorating
        </span>
      );
    }
    if (direction === 'DECREASING') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <TrendingDown className="w-3.5 h-3.5" /> Improving
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Minus className="w-3.5 h-3.5" /> Stable
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header & City Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Activity className="w-3.5 h-3.5" />
            Phase 5 Historical Trends
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
            Empirical Trend Observatory
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Statistical direction and rate-of-change analysis based purely on validated consecutive observations. Zero speculative extrapolations.
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center bg-[#0D1322] border border-gray-800 rounded-xl p-1 gap-1 self-start md:self-auto">
          {activeCitiesList.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCity(c)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCity === c
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Directional Summary Cards for Selected City */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AQI Trend Direction Card */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                AQI Direction
              </span>
              {renderTrendBadge(cityTrend.aqi?.direction)}
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-white font-mono">
                {cityTrend.aqi?.delta !== undefined
                  ? `${cityTrend.aqi.delta > 0 ? '+' : ''}${cityTrend.aqi.delta} pts`
                  : '0 pts'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Trajectory over the most recent consecutive measurement windows.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800/80 text-[11px] font-mono text-gray-500">
            Current: {cityTrend.aqi?.current ?? 'N/A'} AQI
          </div>
        </div>

        {/* PM2.5 Trend Direction Card */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                PM2.5 Rate of Change
              </span>
              {renderTrendBadge(cityTrend.pm2_5?.direction)}
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-white font-mono">
                {cityTrend.pm2_5?.delta !== undefined
                  ? `${cityTrend.pm2_5.delta > 0 ? '+' : ''}${cityTrend.pm2_5.delta} µg/m³`
                  : '0 µg/m³'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Delta calculated from confirmed ground particulate readings.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800/80 text-[11px] font-mono text-gray-500">
            Current: {cityTrend.pm2_5?.current ?? 'N/A'} µg/m³
          </div>
        </div>

        {/* Temperature Trend Direction Card */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Thermal Variation
              </span>
              {renderTrendBadge(cityTrend.temperature?.direction)}
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-white font-mono">
                {cityTrend.temperature?.delta !== undefined
                  ? `${cityTrend.temperature.delta > 0 ? '+' : ''}${cityTrend.temperature.delta}°C`
                  : '0°C'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Micro-meteorological delta across monitoring cycles.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800/80 text-[11px] font-mono text-gray-500">
            Current: {cityTrend.temperature?.current ?? 'N/A'}°C
          </div>
        </div>
      </div>

      {/* Discrete Trend Charts: AQI, PM2.5, Temperature */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">
          {selectedCity} — Observation Trajectories
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart city={selectedCity} initialMetric="aqi" />
          <TrendChart city={selectedCity} initialMetric="pm2_5" />
        </div>

        <div>
          <TrendChart city={selectedCity} initialMetric="temperature" />
        </div>
      </div>

      {/* Trend Integrity Notice */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 flex items-start gap-3 text-xs text-gray-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">Empirical Trend Methodology:</strong>
          Trend directions are computed by comparing linear deltas against standard standard deviation thresholds. When observations are insufficient for a selected window, the system explicitly warns &quot;Insufficient historical observations&quot; rather than synthesizing fictitious points.
        </div>
      </div>
    </div>
  );
}
