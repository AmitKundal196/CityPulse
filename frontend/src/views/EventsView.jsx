import React, { useState } from 'react';
import {
  ListFilter,
  Building2,
  Filter,
  MapPin,
  ChevronDown,
  Info,
  Clock,
  Sliders,
  Search,
  Database
} from 'lucide-react';
import { useCivicData } from '../context/CivicDataContext';

export default function EventsView() {
  const { events, activeCitiesList } = useCivicData();
  const [cityFilter, setCityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [syntheticFilter, setSyntheticFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const sources = ['all', 'open-meteo', 'weather', 'air_quality', 'traffic', 'complaint', 'citizen', 'demo'];
  const zones = ['all', 'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

  // Helper to determine if an event is REAL or SIMULATED according to pipeline rules:
  // - Citizen-submitted complaint (source: 'citizen', synthetic: false) -> REAL
  // - Demo/sample/generated complaint (source: 'demo' or synthetic: true) -> SIMULATED
  // - Sensor telemetry (weather/air_quality/traffic): genuine feeds -> REAL
  const isRecordReal = (e) => {
    const isComplaint = e.source === 'complaint' || e.source === 'citizen' || e.source === 'demo' || Boolean(e.metadata?.complaintId);
    if (isComplaint) {
      return e.source === 'citizen' && !e.synthetic && !e.isSynthetic && e.isReal !== false;
    }
    return !e.isSynthetic && !e.synthetic && e.isReal !== false;
  };

  // Apply in-memory multi-attribute filters
  const filteredEvents = (events || []).filter((e) => {
    if (cityFilter !== 'all' && e.city?.toLowerCase() !== cityFilter.toLowerCase()) return false;

    if (sourceFilter !== 'all') {
      const s = e.source?.toLowerCase();
      if (sourceFilter === 'complaint') {
        if (s !== 'complaint' && s !== 'citizen' && s !== 'demo' && !e.metadata?.complaintId) return false;
      } else if (s !== sourceFilter.toLowerCase()) {
        return false;
      }
    }

    if (zoneFilter !== 'all' && e.zone?.toLowerCase() !== zoneFilter.toLowerCase()) return false;

    const real = isRecordReal(e);
    if (syntheticFilter === 'real' && !real) return false;
    if (syntheticFilter === 'synthetic' && real) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        e.city?.toLowerCase().includes(q) ||
        e.source?.toLowerCase().includes(q) ||
        e.eventType?.toLowerCase().includes(q) ||
        String(e.value).toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ListFilter className="w-3.5 h-3.5" />
            Normalized Event Log
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
            Civic Telemetry & Observation Explorer
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Inspect normalized data points ingested into the database. Filter by urban center, source feed, zone, or empirical authenticity.
          </p>
        </div>

        <div className="text-xs font-mono text-gray-400 bg-gray-900/80 border border-gray-800 px-3 py-2 rounded-xl flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <span>Showing {filteredEvents.length} of {events.length} records</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 bg-[#0D1322] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search event or value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none w-full placeholder:text-gray-600"
            />
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-2 bg-[#0D1322] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-gray-500">City:</span>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-gray-900 text-white">All Cities</option>
              {activeCitiesList.map((c) => (
                <option key={c} value={c} className="bg-gray-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-2 bg-[#0D1322] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-gray-500">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer w-full uppercase"
            >
              {sources.map((s) => (
                <option key={s} value={s} className="bg-gray-900 text-white">
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Zone Filter */}
          <div className="flex items-center gap-2 bg-[#0D1322] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-gray-500">Zone:</span>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer w-full"
            >
              {zones.map((z) => (
                <option key={z} value={z} className="bg-gray-900 text-white">
                  {z.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Authenticity Filter */}
          <div className="flex items-center gap-2 bg-[#0D1322] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-gray-500">Data Type:</span>
            <select
              value={syntheticFilter}
              onChange={(e) => setSyntheticFilter(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-gray-900 text-white">All Records</option>
              <option value="real" className="bg-gray-900 text-emerald-400">Real Feeds Only</option>
              <option value="synthetic" className="bg-gray-900 text-amber-400">Simulated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-[#0D1322] text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">City</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Value</th>
                <th className="py-3.5 px-4">Zone</th>
                <th className="py-3.5 px-4">Synthetic</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500 font-sans italic">
                    No normalized records matching the active filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, 50).map((evt) => {
                  const isExpanded = expandedId === evt._id;
                  return (
                    <React.Fragment key={evt._id}>
                      <tr className="hover:bg-gray-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-gray-400 whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white font-sans">{evt.city}</td>
                        <td className="py-3.5 px-4 text-blue-400 font-semibold">{evt.eventType}</td>
                        <td className="py-3.5 px-4 text-gray-300 font-sans">{evt.source}</td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {evt.value} <span className="text-gray-400 text-[10px] font-normal">{evt.unit || ''}</span>
                        </td>
                        <td className="py-3.5 px-4 text-purple-300">{evt.zone || '—'}</td>
                        <td className="py-3.5 px-4">
                          {isRecordReal(evt) ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              REAL
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              SIMULATED
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-sans">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : evt._id)}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Technical Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-[#090D17]">
                          <td colSpan="8" className="p-4 border-b border-gray-800 font-mono text-[11px]">
                            <div className="space-y-2 bg-[#0D1322] p-4 rounded-xl border border-gray-800/80">
                              <div className="flex items-center justify-between text-xs font-bold text-white pb-2 border-b border-gray-800 font-sans">
                                <span>Technical Metadata & Audit Inspection</span>
                                <span className="text-[10px] text-gray-500 font-mono">ID: {evt._id}</span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-gray-300 pt-1">
                                <div>
                                  <span className="text-gray-500 block text-[10px]">Source Timestamp:</span>
                                  <span>{evt.timestamp}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">Coordinates:</span>
                                  <span>{evt.latitude}, {evt.longitude}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">Severity Rating:</span>
                                  <span className="uppercase text-amber-400">{evt.severity || 'nominal'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">Ingestion Record:</span>
                                  <span>{evt.createdAt || 'Stream'}</span>
                                </div>
                              </div>

                              {evt.metadata && (
                                <div className="mt-3 pt-2 border-t border-gray-800/60">
                                  <span className="text-gray-500 block text-[10px] mb-1">
                                    Raw Ingestion Payload (JSON):
                                  </span>
                                  <pre className="bg-[#080C14] p-3 rounded-lg border border-gray-800/80 text-[10px] text-gray-300 overflow-x-auto">
                                    {JSON.stringify(evt.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
