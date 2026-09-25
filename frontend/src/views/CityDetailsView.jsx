import React, { useState } from 'react';
import {
  Building2,
  Wind,
  Thermometer,
  Droplets,
  Clock,
  AlertTriangle,
  Layers,
  ListFilter,
  ShieldCheck,
  ChevronDown,
  Info
} from 'lucide-react';
import { useCivicData } from '../context/CivicDataContext';
import TrendChart from '../components/TrendChart';

export default function CityDetailsView({ selectedCityName, onCityChange }) {
  const {
    activeCitiesList,
    getCityAqi,
    getCityWeather,
    alertsData,
    insights,
    events,
    systemStatus
  } = useCivicData();

  // Normalize city name matching
  const cityName =
    activeCitiesList.find(
      (c) => c.toLowerCase() === (selectedCityName || '').toLowerCase()
    ) || 'Jaipur';

  const aqi = getCityAqi(cityName);
  const weather = getCityWeather(cityName);
  const feeds = systemStatus?.cities?.[cityName] || {};

  // Filter city-specific items
  const cityAlerts = (alertsData?.activeAlerts || []).filter(
    (a) => a.city?.toLowerCase() === cityName.toLowerCase()
  );
  const cityInsights = (insights || []).filter(
    (i) => i.city?.toLowerCase() === cityName.toLowerCase()
  );
  const cityEvents = (events || []).filter(
    (e) => e.city?.toLowerCase() === cityName.toLowerCase()
  );

  const [expandedEventId, setExpandedEventId] = useState(null);

  const getStatusBadge = (status) => {
    if (status === 'LIVE') {
      return (
        <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
          LIVE
        </span>
      );
    }
    if (status === 'STALE') {
      return (
        <span className="text-xs font-bold tracking-wider text-amber-400 uppercase">
          STALE
        </span>
      );
    }
    if (status === 'SIMULATED') {
      return (
        <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">
          SIMULATED
        </span>
      );
    }
    if (status === 'NOT_CONFIGURED') {
      return (
        <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
          NOT CONFIGURED
        </span>
      );
    }
    if (status === 'NO_REPORTS') {
      return (
        <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
          NO REPORTS
        </span>
      );
    }
    return (
      <span className="text-xs font-bold tracking-wider text-rose-400 uppercase">
        OFFLINE
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* City Header & Selector */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Urban Telemetry Deep Dive
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-xs text-gray-400">Phase 7 SPA Architecture</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-3">
            {cityName}
            {getStatusBadge(aqi?.status || 'OFFLINE')}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time multi-sensor telemetry, empirical trends, and rule-based observations.
          </p>
        </div>

        {/* City Switching Pills */}
        <div className="flex items-center bg-[#0D1322] border border-gray-800 rounded-xl p-1 gap-1 self-start md:self-auto">
          {activeCitiesList.map((c) => (
            <button
              key={c}
              onClick={() => onCityChange(c)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                c.toLowerCase() === cityName.toLowerCase()
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Current Air Quality + Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CURRENT AIR QUALITY */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Current Air Quality
                </h2>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                Official Air Quality Standard
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 my-2">
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Air Quality Index</span>
                <div className="text-5xl font-black text-white font-mono tracking-tight mt-1">
                  {aqi?.aqi ?? '—'}
                </div>
              </div>
              <div className="sm:text-right">
                <span className="text-xs text-gray-400 block mb-1">Health Category</span>
                <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {aqi?.aqiCategory || 'Data unavailable'}
                </span>
              </div>
            </div>

            {/* Pollutant Breakdown Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-gray-800 text-xs">
              <div className="bg-[#0D1322] p-3 rounded-xl border border-gray-800/80">
                <span className="text-gray-400 text-[11px] block">PM2.5</span>
                <span className="text-base font-bold font-mono text-white mt-1 block">
                  {aqi?.pm25 !== undefined ? `${aqi.pm25} µg/m³` : 'N/A'}
                </span>
              </div>
              <div className="bg-[#0D1322] p-3 rounded-xl border border-gray-800/80">
                <span className="text-gray-400 text-[11px] block">PM10</span>
                <span className="text-base font-bold font-mono text-white mt-1 block">
                  {aqi?.pm10 !== undefined ? `${aqi.pm10} µg/m³` : 'N/A'}
                </span>
              </div>
              <div className="bg-[#0D1322] p-3 rounded-xl border border-gray-800/80">
                <span className="text-gray-400 text-[11px] block">NO₂</span>
                <span className="text-base font-bold font-mono text-white mt-1 block">
                  {aqi?.nitrogenDioxide !== undefined ? `${aqi.nitrogenDioxide} µg/m³` : 'N/A'}
                </span>
              </div>
              <div className="bg-[#0D1322] p-3 rounded-xl border border-gray-800/80">
                <span className="text-gray-400 text-[11px] block">Ozone (O₃)</span>
                <span className="text-base font-bold font-mono text-white mt-1 block">
                  {aqi?.ozone !== undefined ? `${aqi.ozone} µg/m³` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500 font-mono">
            <span>Provider: Open-Meteo Air Quality</span>
            <span>Zero-interpolation</span>
          </div>
        </div>

        {/* WEATHER CONDITIONS */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Micro-Meteorology
                </h2>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                Open-Meteo Weather Feed
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-2">
              <div className="bg-[#0D1322] p-4 rounded-xl border border-gray-800/80">
                <span className="text-gray-400 text-xs flex items-center gap-1.5 mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                  Temperature
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  {weather?.temperature !== undefined ? `${weather.temperature}°C` : 'N/A'}
                </span>
              </div>

              <div className="bg-[#0D1322] p-4 rounded-xl border border-gray-800/80">
                <span className="text-gray-400 text-xs flex items-center gap-1.5 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  Humidity
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  {weather?.humidity !== undefined ? `${weather.humidity}%` : 'N/A'}
                </span>
              </div>

              <div className="bg-[#0D1322] p-4 rounded-xl border border-gray-800/80">
                <span className="text-gray-400 text-xs flex items-center gap-1.5 mb-1">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  Wind Speed
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  {weather?.windSpeed !== undefined ? `${weather.windSpeed} km/h` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="bg-[#0D1322] rounded-xl p-4 border border-gray-800/60 mt-4 flex items-center justify-between text-xs">
              <span className="text-gray-400">Precipitation (Rain):</span>
              <span className="font-mono font-bold text-white">
                {weather?.rain !== undefined ? `${weather.rain} mm` : '0 mm'}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500 font-mono">
            <span>Sensor: Ground Station Model</span>
            <span>Feed: {weather?.status || 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* HISTORICAL TRENDS SECTION */}
      <section aria-labelledby="trends-heading">
        <h2 id="trends-heading" className="text-base font-bold text-white uppercase tracking-wider mb-4">
          {cityName} — Historical Trends
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart city={cityName} initialMetric="aqi" />
          <TrendChart city={cityName} initialMetric="pm2_5" />
        </div>
      </section>

      {/* ACTIVE ALERTS FOR THIS CITY */}
      <section aria-labelledby="city-alerts-heading">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h2 id="city-alerts-heading" className="text-base font-bold text-white uppercase tracking-wider">
              Active Alerts for {cityName}
            </h2>
          </div>
          <span className="text-xs font-mono text-gray-400">
            {cityAlerts.length} Active
          </span>
        </div>

        {cityAlerts.length === 0 ? (
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 text-center text-xs text-gray-500 italic">
            No active threshold alerts registered for {cityName}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cityAlerts.map((alt) => (
              <div
                key={alt.alertId}
                className="bg-[#111827] border border-rose-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      {alt.severity} Severity
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {new Date(alt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{alt.title}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">{alt.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span>Threshold: {alt.threshold}</span>
                  <span className="text-white font-bold">Observed: {alt.observedValue}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>


      {/* RECENT NORMALIZED EVENTS FOR THIS CITY */}
      <section aria-labelledby="city-events-heading">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-blue-400" />
            <h2 id="city-events-heading" className="text-base font-bold text-white uppercase tracking-wider">
              Recent Normalized Events for {cityName}
            </h2>
          </div>
          <span className="text-xs font-mono text-gray-400">
            {cityEvents.length} Recent Records
          </span>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0D1322] text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {cityEvents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500 italic">
                      No recent events recorded for {cityName}.
                    </td>
                  </tr>
                ) : (
                  cityEvents.slice(0, 10).map((evt) => {
                    const isExpanded = expandedEventId === evt._id;
                    return (
                      <React.Fragment key={evt._id}>
                        <tr className="hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-gray-400">
                            {new Date(evt.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4 font-medium text-white">{evt.source}</td>
                          <td className="py-3 px-4 text-gray-300 font-mono">{evt.eventType}</td>
                          <td className="py-3 px-4 font-bold font-mono text-white">
                            {evt.value} {evt.unit || ''}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                              {evt.severity || 'INFO'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setExpandedEventId(isExpanded ? null : evt._id)}
                              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <span>{isExpanded ? 'Hide' : 'View'}</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-[#0D1322]">
                            <td colSpan="6" className="p-4 border-b border-gray-800">
                              <div className="text-[11px] font-mono text-gray-300 space-y-1">
                                <div className="text-gray-400 font-bold mb-1">Normalized Event Payload:</div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  <div>Event ID: <span className="text-white">{evt._id}</span></div>
                                  <div>Coordinates: <span className="text-white">{evt.latitude}, {evt.longitude}</span></div>
                                  <div>Zone: <span className="text-white">{evt.zone || 'N/A'}</span></div>
                                  <div>Synthetic Flag: <span className="text-white">{String(evt.isSynthetic)}</span></div>
                                </div>
                                {evt.metadata && (
                                  <div className="mt-2 text-gray-400">
                                    Metadata: {JSON.stringify(evt.metadata)}
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
      </section>

      {/* FEED STATUS FOR THIS CITY */}
      <section aria-labelledby="city-feeds-heading">
        <h2 id="city-feeds-heading" className="text-base font-bold text-white uppercase tracking-wider mb-4">
          Data Stream Health for {cityName}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs text-gray-400">Air Quality</span>
            {getStatusBadge(feeds.air_quality || 'OFFLINE')}
          </div>
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs text-gray-400">Weather</span>
            {getStatusBadge(feeds.weather || 'OFFLINE')}
          </div>
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs text-gray-400">Traffic</span>
            {getStatusBadge(feeds.traffic || 'NOT_CONFIGURED')}
          </div>
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs text-gray-400">Complaints</span>
            {getStatusBadge(feeds.complaint || 'NO_REPORTS')}
          </div>
        </div>
      </section>
    </div>
  );
}
