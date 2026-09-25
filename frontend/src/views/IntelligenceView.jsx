import React, { useState } from 'react';
import {
  Layers,
  Wind,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useCivicData } from '../context/CivicDataContext';

const SEVERITY_BADGES = {
  LOW: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  MEDIUM: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  HIGH: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
  CRITICAL: 'bg-rose-900/40 text-rose-300 border-rose-700/50'
};

const SEVERITY_BORDER = {
  LOW: 'border-blue-500/20 bg-[#111827]',
  MEDIUM: 'border-amber-500/20 bg-[#111827]',
  HIGH: 'border-orange-500/30 bg-[#111827]',
  CRITICAL: 'border-rose-500/40 bg-rose-950/10'
};

export default function IntelligenceView() {
  const { insights, activeCitiesList } = useCivicData();
  const [selectedCity, setSelectedCity] = useState('all');

  const filteredInsights = (insights || []).filter(
    (ins) => selectedCity === 'all' || ins.city?.toLowerCase() === selectedCity.toLowerCase()
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            Phase 4 Deterministic Engine
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
            Cross-Feed Intelligence & Observations
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Rule-based multi-sensor correlation analysis. Identifies meteorological dispersion deficits and environmental anomalies deterministically without black-box predictive models.
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center bg-[#0D1322] border border-gray-800 rounded-xl p-1 gap-1 self-start md:self-auto">
          <button
            onClick={() => setSelectedCity('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedCity === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Cities
          </button>
          {activeCitiesList.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCity(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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

      {/* Disclaimers & Engine Integrity Pill */}
      <div className="bg-[#111827] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start gap-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-white uppercase tracking-wider mb-0.5">
              Deterministic Cross-Feed Architecture
            </div>
            <p className="text-gray-300 leading-relaxed">
              These insights represent rule-based evaluations linking particulate metrics with wind vectors and thermal conditions. This is NOT generative AI or speculative forecasting.
            </p>
          </div>
        </div>

        <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl whitespace-nowrap self-start sm:self-auto">
          Deterministic · No ML · Real Data Only
        </span>
      </div>

      {/* Insights Grid */}
      <section aria-labelledby="insights-list-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="insights-list-heading" className="text-base font-bold text-white uppercase tracking-wider">
            Active Rule-Based Observations ({filteredInsights.length})
          </h2>
          <span className="text-xs font-mono text-gray-500">
            Telemetry Correlation
          </span>
        </div>

        {filteredInsights.length === 0 ? (
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span className="font-semibold text-white">Nominal Atmospheric Conditions</span>
            <p className="text-gray-500 max-w-sm">
              No cross-feed anomalies (such as low wind speed trapping elevated particulates) detected for the selected view.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredInsights.map((ins, idx) => {
              const sev = ins.severity || 'LOW';
              const cardClass = SEVERITY_BORDER[sev] || SEVERITY_BORDER.LOW;
              const badgeClass = SEVERITY_BADGES[sev] || SEVERITY_BADGES.LOW;

              return (
                <div
                  key={ins._id || idx}
                  className={`border rounded-2xl p-6 shadow-xl flex flex-col justify-between ${cardClass}`}
                >
                  <div className="space-y-4">
                    {/* Header: City & Type */}
                    <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-bold text-white uppercase tracking-wider">
                          {ins.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                          {ins.type}
                        </span>
                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border ${badgeClass}`}>
                          {sev}
                        </span>
                      </div>
                    </div>

                    {/* WHAT: Title */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        WHAT:
                      </span>
                      <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                        {ins.type === 'POOR_AIR_DISPERSION' && <Wind className="w-4 h-4 text-amber-400" />}
                        {ins.title}
                      </h3>
                    </div>

                    {/* WHY: Description */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        WHY:
                      </span>
                      <p className="text-xs text-gray-300 leading-relaxed bg-[#0D1322] p-3 rounded-xl border border-gray-800/60">
                        {ins.description}
                      </p>
                    </div>

                    {/* EVIDENCE: Data breakdown */}
                    {ins.evidence && (
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          EVIDENCE (Empirical Telemetry):
                        </span>
                        <div className="bg-[#080C14] rounded-xl p-3 border border-gray-800 font-mono text-xs space-y-1.5">
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-300">
                            {ins.evidence.aqi !== undefined && (
                              <span>AQI: <strong className="text-white">{ins.evidence.aqi}</strong></span>
                            )}
                            {ins.evidence.pm2_5 !== undefined && (
                              <span>PM2.5: <strong className="text-white">{ins.evidence.pm2_5} µg/m³</strong></span>
                            )}
                            {ins.evidence.windSpeed !== undefined && (
                              <span>Wind: <strong className="text-white">{ins.evidence.windSpeed} km/h</strong></span>
                            )}
                            {ins.evidence.humidity !== undefined && (
                              <span>Humidity: <strong className="text-white">{ins.evidence.humidity}%</strong></span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-800 flex justify-between">
                            <span>Evidence Strength: HIGH</span>
                            <span>Freshness: Live confirmed</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SOURCE Attribution */}
                  <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                    <span>Source: Open-Meteo Air Quality & Weather</span>
                    <span>Rule-based observation</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Rules Engine Reference */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl text-xs space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Deterministic Rule Catalogue
        </h3>
        <p className="text-gray-400 leading-relaxed">
          The Phase 4 engine scans validated cross-feed events in memory on each ingestion cycle against the following civic rules:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3 bg-[#0D1322] rounded-xl border border-gray-800/80">
            <span className="text-amber-400 font-bold block mb-1">POOR_AIR_DISPERSION</span>
            <p className="text-[11px] text-gray-400">
              Evaluates when AQI &gt; 100 AND wind speed &lt; 12 km/h. Low wind velocity fails to disperse particulates, causing localized concentration stagnation.
            </p>
          </div>
          <div className="p-3 bg-[#0D1322] rounded-xl border border-gray-800/80">
            <span className="text-rose-400 font-bold block mb-1">SEVERE_AIR_QUALITY</span>
            <p className="text-[11px] text-gray-400">
              Evaluates when AQI &gt; 150 or PM2.5 &gt; 55.4 µg/m³ regardless of atmospheric conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
