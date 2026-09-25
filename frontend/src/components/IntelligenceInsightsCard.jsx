import React from 'react';
import { Layers, AlertTriangle, Wind, Info, ShieldCheck } from 'lucide-react';

const SEVERITY_COLORS = {
  LOW: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  MEDIUM: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  HIGH: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
  CRITICAL: 'border-rose-500/30 bg-rose-500/10 text-rose-400'
};

const SEVERITY_BADGES = {
  LOW: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  MEDIUM: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  HIGH: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
  CRITICAL: 'bg-rose-900/40 text-rose-300 border-rose-700/50'
};

export default function IntelligenceInsightsCard({ insights = [], activeCities = ['Jaipur', 'Delhi', 'Mumbai'] }) {
  // Group insights by city
  const cityInsights = {};
  activeCities.forEach(c => {
    cityInsights[c] = insights.filter(i => i.city === c);
  });

  return (
    <div className="mb-8" id="phase4-intelligence-section">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-3 h-3" />
            Phase 4 — Intelligence & Cross-Feed Analysis
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            City Pulse Intelligence Layer
          </h2>
        </div>
        <div className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Deterministic · No ML · Real Data Only
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeCities.map(city => {
          const items = cityInsights[city] || [];
          return (
            <div
              key={city}
              className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                  <h3 className="text-base font-bold text-white">{city}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                    {items.length} {items.length === 1 ? 'Insight' : 'Insights'}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500 italic flex flex-col items-center gap-2">
                    <Info className="w-4 h-4 text-gray-600" />
                    Conditions within nominal baseline thresholds.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((insight, idx) => {
                      const sev = insight.severity || 'LOW';
                      const badgeClass = SEVERITY_BADGES[sev] || SEVERITY_BADGES.LOW;

                      return (
                        <div
                          key={insight._id || idx}
                          className={`rounded-xl p-3.5 border text-xs ${SEVERITY_COLORS[sev]} transition-all`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-bold text-sm text-white flex items-center gap-1.5">
                              {insight.type === 'POOR_AIR_DISPERSION' && <Wind className="w-4 h-4 text-amber-400" />}
                              {insight.type === 'AIR_QUALITY' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                              {insight.title}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${badgeClass}`}>
                              {sev}
                            </span>
                          </div>

                          <p className="text-gray-300 leading-relaxed mb-3 text-[11px]">
                            {insight.description}
                          </p>

                          {/* Traceable Evidence Box */}
                          {insight.evidence && (
                            <div className="bg-black/30 border border-white/5 rounded-lg p-2.5 mb-2 font-mono text-[10px] text-gray-300">
                              <span className="font-bold text-gray-400 block mb-1 uppercase tracking-wider text-[9px]">
                                Traceable Evidence:
                              </span>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {insight.evidence.aqi !== undefined && (
                                  <span>AQI: <strong className="text-white">{insight.evidence.aqi}</strong></span>
                                )}
                                {insight.evidence.pm2_5 !== undefined && (
                                  <span>PM2.5: <strong className="text-white">{insight.evidence.pm2_5} µg/m³</strong></span>
                                )}
                                {insight.evidence.windSpeed !== undefined && (
                                  <span>Wind: <strong className="text-white">{insight.evidence.windSpeed} km/h</strong></span>
                                )}
                                {insight.evidence.temperature !== undefined && (
                                  <span>Temp: <strong className="text-white">{insight.evidence.temperature} °C</strong></span>
                                )}
                                {insight.evidence.trafficSeverity !== undefined && (
                                  <span>Traffic: <strong className="text-white">{insight.evidence.trafficSeverity}</strong></span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Provenance & Freshness */}
                          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5">
                            <span>
                              Sources: {insight.sources ? insight.sources.join(', ') : 'Open-Meteo'}
                            </span>
                            <span>
                              Confidence: <strong className="text-gray-200">{insight.confidence || 'HIGH'}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-500 flex items-center justify-between">
                <span>Rule-based observation</span>
                <span>isSynthetic: false</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
