import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Clock,
  ArrowRight
} from 'lucide-react';

function formatAgeText(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'N/A';

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default function CityCard({
  cityName,
  aqiData,
  weatherData,
  onSelectCity
}) {
  const aqiVal = aqiData?.aqi;
  const aqiCat = aqiData?.aqiCategory || 'Unknown';
  const pm25 = aqiData?.pm25;
  const aqiStatus = aqiData?.status || 'OFFLINE';

  const isLive = aqiStatus === 'LIVE';
  const isStale = aqiStatus === 'STALE';

  // Clean, professional, harmonious category colors for dark and light themes
  const categoryBadgeStyles = {
    Good: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    Moderate: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    'Unhealthy for Sensitive Groups': 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30',
    Unhealthy: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    'Very Unhealthy': 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
    Hazardous: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30'
  };

  const aqiTextColors = {
    Good: 'text-emerald-600 dark:text-emerald-400',
    Moderate: 'text-amber-600 dark:text-amber-400',
    'Unhealthy for Sensitive Groups': 'text-orange-600 dark:text-orange-400',
    Unhealthy: 'text-rose-600 dark:text-rose-400',
    'Very Unhealthy': 'text-purple-600 dark:text-purple-400',
    Hazardous: 'text-red-600 dark:text-red-400'
  };

  const badgeClass =
    categoryBadgeStyles[aqiCat] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  const aqiColorClass = aqiTextColors[aqiCat] || 'text-slate-900 dark:text-white';

  return (
    <div
      onClick={() => onSelectCity(cityName)}
      className="bg-white dark:bg-[#131B2E] border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-2xl p-6 shadow-sm dark:shadow-md flex flex-col justify-between transition-all group cursor-pointer hover:-translate-y-0.5"
    >
      {/* City Header & Status (Clean text: NO bullet dot, NO oval box) */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight uppercase group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
              {cityName}
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600 dark:text-blue-400" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Urban Monitoring Station</p>
          </div>

          <div>
            {isLive ? (
              <span className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                LIVE
              </span>
            ) : isStale ? (
              <span className="text-xs font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                STALE
              </span>
            ) : (
              <span className="text-xs font-bold tracking-wider text-rose-600 dark:text-rose-400 uppercase">
                OFFLINE
              </span>
            )}
          </div>
        </div>

        {/* AQI Display Section - Refined Surface */}
        <div className="bg-slate-50/90 dark:bg-[#0D1322] rounded-xl p-4 border border-slate-200/80 dark:border-slate-800/80 mb-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Air Quality Index (AQI)
            </span>
            <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${aqiColorClass}`}>
              {aqiVal !== null && aqiVal !== undefined ? aqiVal : '—'}
            </span>
          </div>

          <div className="mt-2.5 mb-3">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${badgeClass}`}
            >
              {aqiCat}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 font-medium">PM2.5 Concentration:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {pm25 !== null && pm25 !== undefined ? `${pm25} µg/m³` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Weather Metrics Strip - Clean Soft Surface */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50/90 dark:bg-[#0D1322] rounded-xl p-3 border border-slate-200/80 dark:border-slate-800/80 text-xs mb-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              <Thermometer className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Temp
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {weatherData?.temperature !== undefined ? `${weatherData.temperature}°C` : 'N/A'}
            </span>
          </div>

          <div className="flex flex-col border-l border-slate-200 dark:border-slate-800/80 pl-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              <Droplets className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Humidity
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {weatherData?.humidity !== undefined ? `${weatherData.humidity}%` : 'N/A'}
            </span>
          </div>

          <div className="flex flex-col border-l border-slate-200 dark:border-slate-800/80 pl-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              <Wind className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Wind
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {weatherData?.windSpeed !== undefined ? `${weatherData.windSpeed} km/h` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Attributions */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="text-slate-500 dark:text-slate-400 font-medium">Open-Meteo Feeds</span>
      </div>
    </div>
  );
}
