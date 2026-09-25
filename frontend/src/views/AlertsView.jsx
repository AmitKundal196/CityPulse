import React, { useState } from 'react';
import {
  BellRing,
  AlertTriangle,
  History,
  ShieldAlert,
  Clock,
  Filter,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { useCivicData } from '../context/CivicDataContext';

const SEVERITY_BADGES = {
  INFO: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700/60',
  WARNING: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/60',
  HIGH: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700/60',
  CRITICAL: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700/60'
};

const SEVERITY_CARDS = {
  INFO: 'bg-white border-slate-200 dark:bg-[#0D1322] dark:border-blue-500/30',
  WARNING: 'bg-amber-50/40 border-amber-200 dark:bg-[#0D1322] dark:border-amber-500/30',
  HIGH: 'bg-orange-50/40 border-orange-200 dark:bg-[#0D1322] dark:border-orange-500/40',
  CRITICAL: 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-500/50'
};

export default function AlertsView() {
  const { alertsData, activeCitiesList } = useCivicData();
  const [cityFilter, setCityFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const activeAlerts = alertsData?.activeAlerts || [];
  const alertHistory = alertsData?.history || [];

  const filterList = (list) => {
    return list.filter((item) => {
      const matchCity =
        cityFilter === 'all' ||
        item.city?.toLowerCase() === cityFilter.toLowerCase();
      const matchSev =
        severityFilter === 'all' ||
        item.severity?.toLowerCase() === severityFilter.toLowerCase();
      return matchCity && matchSev;
    });
  };

  const filteredActive = filterList(activeAlerts);
  const filteredHistory = filterList(alertHistory);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <BellRing className="w-3.5 h-3.5" />
            Civic Alert Center
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
            Threshold Alerts & Notification Log
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Automated threshold notifications dispatched directly by the Phase 5 backend engine. Zero synthetic alerts.
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* City Filter */}
          <div className="flex items-center gap-2 bg-[#111827] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>City:</span>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-gray-900 text-white">All Cities</option>
              {activeCitiesList.map((c) => (
                <option key={c} value={c} className="bg-gray-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2 bg-[#111827] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer uppercase"
            >
              <option value="all" className="bg-gray-900 text-white">ALL SEVERITIES</option>
              <option value="critical" className="bg-gray-900 text-rose-400">CRITICAL</option>
              <option value="high" className="bg-gray-900 text-orange-400">HIGH</option>
              <option value="warning" className="bg-gray-900 text-amber-400">WARNING</option>
              <option value="info" className="bg-gray-900 text-blue-400">INFO</option>
            </select>
          </div>
        </div>
      </div>

      {/* ACTIVE ALERTS SECTION */}
      <section aria-labelledby="active-alerts-heading">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h2 id="active-alerts-heading" className="text-base font-bold text-white uppercase tracking-wider">
              Active Alerts ({filteredActive.length})
            </h2>
          </div>
          <span className="text-xs text-gray-500 font-mono">Real-time Backend Registry</span>
        </div>

        {filteredActive.length === 0 ? (
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span className="font-semibold text-white">No active threshold alerts match your filters</span>
            <p className="text-gray-500 max-w-sm">
              All monitored metrics are operating within established safe operational bounds.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActive.map((alt) => {
              const sev = alt.severity || 'INFO';
              const cardClass = SEVERITY_CARDS[sev] || SEVERITY_CARDS.INFO;
              const badgeClass = SEVERITY_BADGES[sev] || SEVERITY_BADGES.INFO;

              return (
                <div
                  key={alt.alertId || alt._id}
                  className={`border rounded-2xl p-5 shadow-xl flex flex-col justify-between ${cardClass}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border ${badgeClass}`}>
                        {sev}
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-400" />
                        {alt.city}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight mb-1">
                      {alt.title}
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed mb-4">
                      {alt.description}
                    </p>

                    <div className="bg-[#080C14] rounded-xl p-3 border border-gray-800 font-mono text-xs space-y-1">
                      <div className="flex justify-between text-gray-400">
                        <span>Trigger Metric:</span>
                        <span className="text-white font-bold">{alt.metric || 'AQI'}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Observed Value:</span>
                        <span className="text-rose-400 font-bold">{alt.observedValue}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Safety Threshold:</span>
                        <span className="text-gray-300">{alt.threshold}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-600" />
                      {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>Source: {alt.source || 'Open-Meteo'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* RECENT ALERTS (ALERT HISTORY) */}
      <section aria-labelledby="alert-history-heading">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <h2 id="alert-history-heading" className="text-base font-bold text-white uppercase tracking-wider">
              Alert Incident History ({filteredHistory.length})
            </h2>
          </div>
          <span className="text-xs text-gray-500 font-mono">Historical Archive</span>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0D1322] text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Alert Event</th>
                  <th className="py-3 px-4">Observed Value</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500 italic">
                      No historical alert records matching selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.slice(0, 15).map((item, idx) => (
                    <tr key={item.alertId || idx} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {new Date(item.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${SEVERITY_BADGES[item.severity] || SEVERITY_BADGES.INFO}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{item.city}</td>
                      <td className="py-3 px-4 text-gray-200">{item.title}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-400">{item.observedValue}</td>
                      <td className="py-3 px-4 font-mono text-gray-400">{item.threshold}</td>
                      <td className="py-3 px-4 font-mono text-gray-400">{item.source || 'Open-Meteo'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Threshold Reference Guide */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl text-xs">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-400" />
          Configured Alert Threshold Policy
        </h3>
        <p className="text-gray-400 mb-4">
          Alert triggers are evaluated deterministically whenever new normalized observations are ingested into the database.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-gray-300">
          <div className="bg-[#0D1322] p-3 rounded-xl border border-gray-800/80">
            <span className="text-orange-400 font-bold block mb-1">HIGH AQI & PM2.5</span>
            <p className="text-[11px] text-gray-400">
              Triggers when U.S. AQI exceeds 150 (Unhealthy) or fine particulate PM2.5 exceeds 55.4 µg/m³.
            </p>
          </div>
          <div className="bg-[#0D1322] p-3 rounded-xl border border-gray-800/80">
            <span className="text-rose-400 font-bold block mb-1">CRITICAL HEALTH ALERT</span>
            <p className="text-[11px] text-gray-400">
              Triggers when AQI exceeds 200 (Very Unhealthy) or PM2.5 exceeds 150.4 µg/m³ emergency thresholds.
            </p>
          </div>
          <div className="bg-[#0D1322] p-3 rounded-xl border border-gray-800/80">
            <span className="text-amber-400 font-bold block mb-1">THERMAL ADVISORY</span>
            <p className="text-[11px] text-gray-400">
              Triggers when ambient temperatures exceed 40°C heatwave thresholds or drop below seasonal nominals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
