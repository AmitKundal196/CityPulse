import React from 'react';
import { Filter, MapPin, Sliders, Building2 } from 'lucide-react';

export default function EventsTable({
  events = [],
  cityFilter,
  setCityFilter,
  sourceFilter,
  setSourceFilter,
  zoneFilter,
  setZoneFilter,
  cities = []
}) {
  const sources = ['all', 'weather', 'air_quality', 'traffic', 'complaint', 'citizen', 'demo'];
  const zones = ['all', 'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

  return (
    <div className="w-full bg-[#131B2E] border border-gray-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Latest Collected Events</h2>
          <p className="text-xs text-gray-400">Multi-city real-time normalized stream</p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* City Filter Dropdown */}
          <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>City:</span>
            <select
              id="city-filter-select"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-gray-900 text-white">All Cities</option>
              {cities.map(c => (
                <option key={c.id || c.name} value={c.name} className="bg-gray-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter Dropdown */}
          <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer"
            >
              {sources.map(s => (
                <option key={s} value={s} className="bg-gray-900 text-white">
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Zone Filter Dropdown */}
          <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            <span>Zone:</span>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer"
            >
              {zones.map(z => (
                <option key={z} value={z} className="bg-gray-900 text-white">
                  {z.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800/80 text-gray-400 text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Time</th>
              <th className="py-3 px-4 font-semibold">City</th>
              <th className="py-3 px-4 font-semibold">Source</th>
              <th className="py-3 px-4 font-semibold">Event</th>
              <th className="py-3 px-4 font-semibold">Zone</th>
              <th className="py-3 px-4 font-semibold">Value</th>
              <th className="py-3 px-4 font-semibold">Synthetic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50 text-sm">
            {events.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-gray-500 text-sm">
                  No events found matching the selected filters.
                </td>
              </tr>
            ) : (
              events.map((evt, idx) => {
                const timeStr = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'N/A';
                const dateStr = evt.timestamp ? new Date(evt.timestamp).toLocaleDateString() : '';

                return (
                  <tr key={evt._id || idx} className="hover:bg-gray-900/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-300 font-mono">
                      <div>{timeStr}</div>
                      <div className="text-[10px] text-gray-500">{dateStr}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-white">
                      {evt.city || 'Unknown'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                        {evt.source}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-white capitalize whitespace-nowrap">
                      {evt.eventType ? evt.eventType.replace('_', ' ') : 'N/A'}
                      {evt.severity && (
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          evt.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          evt.severity === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {evt.severity}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {evt.zone}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-sm text-gray-200">
                      {evt.value !== null && evt.value !== undefined ? (
                        <span>
                          {evt.value} <span className="text-xs text-gray-400">{evt.unit || ''}</span>
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {(() => {
                        const isComplaint = evt.source === 'complaint' || evt.source === 'citizen' || evt.source === 'demo' || Boolean(evt.metadata?.complaintId);
                        const isReal = isComplaint
                          ? (evt.source === 'citizen' && !evt.synthetic && !evt.isSynthetic && evt.isReal !== false)
                          : (!evt.isSynthetic && !evt.synthetic && evt.isReal !== false);

                        return isReal ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            REAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Sliders className="w-3 h-3" />
                            SIMULATED
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
