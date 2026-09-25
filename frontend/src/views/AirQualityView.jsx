import React, { useState } from 'react';
import {
  Wind,
  Info,
  Clock,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { useCivicData } from '../context/CivicDataContext';
import TrendChart from '../components/TrendChart';

const AQI_BREAKPOINTS = [
  { range: '0 – 50', category: 'Good', pm25: '0.0 – 12.0 µg/m³', color: 'text-emerald-400', desc: 'Air quality is satisfactory and poses little or no risk.' },
  { range: '51 – 100', category: 'Moderate', pm25: '12.1 – 35.4 µg/m³', color: 'text-yellow-400', desc: 'Acceptable quality; sensitive individuals may experience minor irritation.' },
  { range: '101 – 150', category: 'Unhealthy for Sensitive Groups', pm25: '35.5 – 55.4 µg/m³', color: 'text-orange-400', desc: 'General public not likely affected; sensitive groups may experience health effects.' },
  { range: '151 – 200', category: 'Unhealthy', pm25: '55.5 – 150.4 µg/m³', color: 'text-rose-400', desc: 'Some members of general public may experience health effects; sensitive groups more serious.' },
  { range: '201 – 300', category: 'Very Unhealthy', pm25: '150.5 – 250.4 µg/m³', color: 'text-purple-400', desc: 'Health alert: risk of health effects increased for everyone.' },
  { range: '301 – 500', category: 'Hazardous', pm25: '250.5 – 500.4 µg/m³', color: 'text-red-500', desc: 'Health warning of emergency conditions: everyone is more likely to be affected.' }
];

export default function AirQualityView() {
  const { activeCitiesList, getCityAqi } = useCivicData();
  const [selectedCity, setSelectedCity] = useState('Jaipur');
  const [methodologyExpanded, setMethodologyExpanded] = useState(false);

  const currentAqi = getCityAqi(selectedCity);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Wind className="w-3.5 h-3.5" />
            Air Quality Observatory
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
            Atmospheric & Particulate Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Real-time Air Quality Index (AQI) calculated directly from Open-Meteo U.S. EPA methodology. Strict adherence to empirical observations without synthetic inflation.
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

      {/* Primary City AQI Metrics Card */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
                Primary Monitored Center
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {currentAqi?.status === 'LIVE' ? 'LIVE' : 'STALE'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-1">
              {selectedCity}
            </h2>
          </div>

          <div className="text-xs text-gray-400 font-mono">
            Source: Open-Meteo Air Quality
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          {/* Big AQI Number */}
          <div className="bg-[#0D1322] p-5 rounded-xl border border-gray-800/80 flex flex-col justify-between">
            <span className="text-xs text-gray-400 uppercase font-semibold">U.S. EPA AQI</span>
            <div className="my-2">
              <span className="text-5xl font-black text-white font-mono">
                {currentAqi?.aqi ?? '—'}
              </span>
              <span className="text-sm text-gray-500 font-mono ml-2">INDEX</span>
            </div>
            <span className="text-xs font-bold text-blue-400">
              {currentAqi?.aqiCategory || 'Data unavailable'}
            </span>
          </div>

          {/* PM2.5 and PM10 */}
          <div className="bg-[#0D1322] p-5 rounded-xl border border-gray-800/80 flex flex-col justify-between">
            <span className="text-xs text-gray-400 uppercase font-semibold">Particulate Matter</span>
            <div className="space-y-3 my-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono">PM2.5 (Fine):</span>
                <span className="text-lg font-bold text-white font-mono">
                  {currentAqi?.pm25 !== undefined ? `${currentAqi.pm25} µg/m³` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono">PM10 (Coarse):</span>
                <span className="text-lg font-bold text-white font-mono">
                  {currentAqi?.pm10 !== undefined ? `${currentAqi.pm10} µg/m³` : 'N/A'}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">Key respiratory indicators</span>
          </div>

          {/* Trace Gases */}
          <div className="bg-[#0D1322] p-5 rounded-xl border border-gray-800/80 flex flex-col justify-between">
            <span className="text-xs text-gray-400 uppercase font-semibold">Secondary Gaseous Feeds</span>
            <div className="space-y-3 my-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono">Nitrogen Dioxide (NO₂):</span>
                <span className="text-base font-bold text-white font-mono">
                  {currentAqi?.nitrogenDioxide !== undefined ? `${currentAqi.nitrogenDioxide} µg/m³` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono">Ozone (O₃):</span>
                <span className="text-base font-bold text-white font-mono">
                  {currentAqi?.ozone !== undefined ? `${currentAqi.ozone} µg/m³` : 'N/A'}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">Photochemical precursors</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Open-Meteo Air Quality Feeds</span>
          </div>
          <span className="font-mono text-[11px] text-gray-500">
            Observation timestamp: {currentAqi?.timestamp ? new Date(currentAqi.timestamp).toLocaleString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Historical Trend Charts for Selected City */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart city={selectedCity} initialMetric="aqi" />
        <TrendChart city={selectedCity} initialMetric="pm2_5" />
      </div>

      {/* Technical Methodology Expandable Section */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <button
          onClick={() => setMethodologyExpanded(!methodologyExpanded)}
          className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-blue-400 transition-colors">
                U.S. EPA AQI Standard & Breakpoint Methodology
              </h3>
              <p className="text-xs text-gray-400">
                Official EPA PM2.5 breakpoint reference table and standard calculation disclosure
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${methodologyExpanded ? 'rotate-180' : ''}`} />
        </button>

        {methodologyExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-800 space-y-4 text-xs animate-fadeIn">
            <p className="text-gray-300 leading-relaxed">
              The Air Quality Index (AQI) converts raw particulate concentrations (PM2.5) into a standardized 0–500 scale according to the United States Environmental Protection Agency (U.S. EPA) guidelines. The backend consumes the pre-calculated official consolidated <code className="text-blue-400 font-mono">us_aqi</code> feed from Open-Meteo, preventing client-side rounding discrepancies.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#0D1322] text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">AQI Range</th>
                    <th className="py-2.5 px-4 font-semibold">Category</th>
                    <th className="py-2.5 px-4 font-semibold">PM2.5 Concentration</th>
                    <th className="py-2.5 px-4 font-semibold">Health Implication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {AQI_BREAKPOINTS.map((b, i) => (
                    <tr key={i} className="hover:bg-gray-800/30">
                      <td className="py-2.5 px-4 font-bold text-white">{b.range}</td>
                      <td className={`py-2.5 px-4 font-bold ${b.color}`}>{b.category}</td>
                      <td className="py-2.5 px-4 text-gray-300">{b.pm25}</td>
                      <td className="py-2.5 px-4 text-gray-400 font-sans">{b.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#0D1322] rounded-xl border border-gray-800/80 text-[11px] text-gray-400">
              <strong>Notice on Data Integrity:</strong> City Pulse does not treat PM2.5 mass concentration as AQI, nor does it interpolate fake values during sensor outages. In periods of network or upstream degradation, the dashboard gracefully marks the observation as STALE or OFFLINE.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
