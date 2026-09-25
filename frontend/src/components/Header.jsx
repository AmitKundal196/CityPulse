import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Clock, MapPin, Activity, AlertCircle, WifiOff } from 'lucide-react';
import { useCivicData } from '../context/CivicDataContext';

function getRelativeTime(date) {
  if (!date) return 'just now';
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours === 1) return '1 hr ago';
  return `${diffHours} hrs ago`;
}

export default function Header({ currentRoute, onNavigate }) {
  const {
    activeCity,
    setActiveCity,
    activeCitiesList,
    overallSystemStatus,
    lastUpdated,
    loading,
    refreshData
  } = useCivicData();

  const [relTime, setRelTime] = useState(getRelativeTime(lastUpdated));

  useEffect(() => {
    setRelTime(getRelativeTime(lastUpdated));
    const timer = setInterval(() => {
      setRelTime(getRelativeTime(lastUpdated));
    }, 10000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const handleCityChange = (cityName) => {
    setActiveCity(cityName);
    if (currentRoute.startsWith('city')) {
      onNavigate(`city/${cityName.toLowerCase()}`);
    }
  };

  return (
    <header className="app-header border-b border-[#F0B296] bg-[#FED7C3] sticky top-0 z-30 shadow-xs" style={{ backgroundColor: '#FED7C3', borderColor: '#F0B296' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('overview')}
              className="flex items-center gap-3 group text-left focus:outline-none"
              aria-label="City Pulse Overview"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-base sm:text-lg font-extrabold tracking-tight uppercase group-hover:text-blue-700 transition-colors"
                    style={{ color: '#0F172A' }}
                  >
                    CITY PULSE
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/70 text-slate-700 border border-orange-200">
                    LIVE CIVIC HEALTH
                  </span>
                </div>
                <p className="text-xs text-slate-600 tracking-tight font-medium">
                  Live Civic Health Dashboard
                </p>
              </div>
            </button>
          </div>

          {/* Right Controls: City Switcher, Refresh */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">

            {/* City Selector */}
            <div className="flex items-center gap-1.5 bg-white/80 border border-orange-200/90 rounded-lg px-2.5 py-1 text-slate-800 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <label htmlFor="header-city-select" className="sr-only">Select City</label>
              <select
                id="header-city-select"
                value={activeCity}
                onChange={(e) => handleCityChange(e.target.value)}
                style={{ color: '#0F172A' }}
                className="bg-transparent border-none font-semibold text-xs focus:outline-none cursor-pointer pr-1"
              >
                {activeCitiesList.map((cityName) => (
                  <option key={cityName} value={cityName} className="bg-white text-slate-900">
                    {cityName}
                  </option>
                ))}
              </select>
            </div>

            {/* Manual Refresh Button */}
            <button
              id="header-refresh-btn"
              onClick={refreshData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/60 disabled:cursor-not-allowed text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
              title="Synchronize all city feeds"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
