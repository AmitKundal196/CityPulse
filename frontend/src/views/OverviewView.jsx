import React from 'react';
import {
  Activity,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Radio,
  Server,
  Map
} from 'lucide-react';
import { useCivicData } from '../context/CivicDataContext';
import CityCard from '../components/CityCard';
import DataSourcesBanner from '../components/DataSourcesBanner';
import LiveMap from '../components/LiveMap';

export default function OverviewView({ onNavigate }) {
  const {
    activeCitiesList,
    getCityAqi,
    getCityWeather,
    alertsData,
    insights,
    systemStatus,
    setActiveCity,
    loading
  } = useCivicData();

  const handleCitySelect = (cityName) => {
    setActiveCity(cityName);
    onNavigate(`city/${cityName.toLowerCase()}`);
  };

  const activeAlerts = alertsData?.activeAlerts || [];
  const citiesStatus = systemStatus?.cities || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Overview Top Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            CITY PULSE
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1 max-w-2xl">
            Live Civic Health Dashboard monitoring empirical air quality, micro-meteorology, and urban telemetry across Jaipur, Delhi, and Mumbai.
          </p>
        </div>
      </div>

      {/* Active Alerts Banner if alerts are triggered */}
      {activeAlerts.length > 0 && (
        <div className="bg-white dark:bg-gradient-to-r dark:from-rose-950/30 dark:via-[#131B2E] dark:to-[#131B2E] border border-rose-200 dark:border-rose-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm dark:shadow-lg dark:shadow-rose-950/20 backdrop-blur-md transition-all">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {activeAlerts.length} Active System Alert{activeAlerts.length > 1 ? 's' : ''}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 font-mono tracking-wide">
                  Threshold Exceeded
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Elevated readings detected in <span className="font-semibold text-slate-900 dark:text-white">{Array.from(new Set(activeAlerts.map(a => a.city))).join(', ')}</span>. Review threshold violations and telemetry.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('alerts')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto active:scale-95"
          >
            <span>Review Alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3 Main City Cards: Jaipur, Delhi, Mumbai */}
      <section aria-labelledby="monitored-cities-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="monitored-cities-heading" className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Monitored Urban Centers
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Click any city card to explore detailed telemetry, sensor breakdowns, and historical trends.
            </p>
          </div>
          <span className="text-xs text-gray-500 font-mono hidden sm:inline">
            3 Urban Feeds
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeCitiesList.map((cityName) => (
            <CityCard
              key={cityName}
              cityName={cityName}
              aqiData={getCityAqi(cityName)}
              weatherData={getCityWeather(cityName)}
              onSelectCity={handleCitySelect}
            />
          ))}
        </div>
      </section>

      {/* Real-time Interactive Live Map Section */}
      <section aria-labelledby="live-map-section-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="live-map-section-heading" className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Map className="w-4 h-4 text-blue-400" />
              Real-Time Operations Map
            </h2>
            <p className="text-xs text-gray-400">
              Interactive spatial view of Jaipur, Delhi, and Mumbai with real-time empirical telemetry overlays
            </p>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
          >
            <span>Full Map View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <LiveMap height="400px" onSelectCity={handleCitySelect} />
      </section>


      {/* Multi-City Data Sources Status Banner */}
      <DataSourcesBanner citiesStatus={citiesStatus} />
    </div>
  );
}
