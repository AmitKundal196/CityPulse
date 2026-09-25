import React from 'react';
import { Wind, Clock } from 'lucide-react';

function formatAgeText(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'N/A';

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default function AqiSummaryCard({ cityName, aqiDetails, feedStatus }) {
  const currentStatus = aqiDetails?.status || feedStatus || 'OFFLINE';
  const isLive = currentStatus === 'LIVE';
  const isStale = currentStatus === 'STALE';

  const aqiVal = aqiDetails?.aqi ?? aqiDetails?.usAqi ?? aqiDetails?.usAqiPm25;
  const rawPm25 = aqiDetails?.rawPM25 ?? aqiDetails?.pm25;

  const isAvailable = (isLive || isStale) && aqiDetails && aqiVal !== null && aqiVal !== undefined;

  const categoryColors = {
    Good: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Moderate: 'bg-amber-50 text-amber-800 border-amber-200',
    'Unhealthy for Sensitive Groups': 'bg-orange-50 text-orange-800 border-orange-200',
    Unhealthy: 'bg-rose-50 text-rose-800 border-rose-200',
    'Very Unhealthy': 'bg-purple-50 text-purple-800 border-purple-200',
    Hazardous: 'bg-red-50 text-red-800 border-red-200'
  };

  const badgeStyle = categoryColors[aqiDetails?.aqiCategory] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between hover:border-blue-400/50 transition-colors">
      {/* City Header & Status (NO bullet dot, NO oval box) */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">{cityName}</h3>
            <p className="text-[11px] text-slate-500">Current Air Quality</p>
          </div>
        </div>

        <div>
          {isLive ? (
            <span className="text-xs font-bold tracking-wider text-emerald-600 uppercase">
              LIVE
            </span>
          ) : isStale ? (
            <span className="text-xs font-bold tracking-wider text-amber-600 uppercase">
              STALE
            </span>
          ) : (
            <span className="text-xs font-bold tracking-wider text-rose-600 uppercase">
              OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Main AQI Value Display */}
      {isAvailable ? (
        <div className="py-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-500 uppercase font-semibold">AQI</span>
            <span className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
              {aqiVal}
            </span>
          </div>

          <div className="mt-2.5 mb-4">
            <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${badgeStyle}`}>
              {aqiDetails.aqiCategory || 'N/A'}
            </span>
          </div>

          {/* PM2.5 and PM10 Concentration */}
          <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500 font-medium">PM2.5:</span>
              <span className="font-mono font-bold text-slate-900">
                {rawPm25 !== null && rawPm25 !== undefined ? `${rawPm25} µg/m³` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 text-xs">
              <span className="text-slate-500 font-medium">PM10:</span>
              <span className="font-mono font-bold text-slate-900">
                {aqiDetails.pm10 !== null && aqiDetails.pm10 !== undefined ? `${aqiDetails.pm10} µg/m³` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center">
          <span className="text-3xl font-extrabold text-gray-500 block mb-1">AQI —</span>
          <p className="text-xs text-gray-400">Air quality data unavailable</p>
        </div>
      )}

      {/* Footer Info & Attribution (NO Based on US AQI text) */}
      <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
        <span>Open-Meteo Feeds</span>
        {isAvailable && aqiDetails?.timestamp && (
          <div className="flex items-center gap-1 font-mono text-gray-400">
            <Clock className="w-3 h-3 text-gray-500" />
            <span>Updated {formatAgeText(aqiDetails.timestamp)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
