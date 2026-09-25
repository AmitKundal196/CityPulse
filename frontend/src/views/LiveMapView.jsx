import React, { useState } from 'react';
import {
  Map,
  MapPin,
  Layers,
  Radio,
  Clock,
  ShieldCheck,
  Building2,
  Navigation
} from 'lucide-react';
import LiveMap from '../components/LiveMap';
import { useCivicData } from '../context/CivicDataContext';

export default function LiveMapView({ onSelectCity }) {
  const { cities, events, lastUpdated } = useCivicData();
  const [selectedCity, setSelectedCity] = useState('all');

  const geocodedEvents = (events || []).filter(
    (e) => typeof e.latitude === 'number' && typeof e.longitude === 'number' && e.latitude !== 0
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Map className="w-3.5 h-3.5" />
            Geospatial Telemetry Layer
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
            Live Urban Operations Map
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Real-time geospatial mapping of atmospheric conditions, micro-meteorology, traffic alerts, and municipal observations across monitored zones.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-gray-400 bg-gray-900/80 border border-gray-800 px-3 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{geocodedEvents.length} Active Coordinates · Zero Fake Locations</span>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="w-full">
        <LiveMap
          initialCity={selectedCity}
          height="460px"
          onSelectCity={onSelectCity}
        />
      </div>

      {/* Map Technical Methodology & Policy */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl text-xs space-y-3">
        <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-sm">
          <Navigation className="w-4 h-4 text-blue-400" />
          Geospatial Integrity & Privacy Policy
        </div>

        <p className="text-gray-400 leading-relaxed">
          The City Pulse live map plots only empirical geographic data provided directly by the backend database. City centers are located at their official municipal coordinates:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 font-mono text-xs">
          <div className="p-3 bg-[#0D1322] rounded-xl border border-gray-800/80">
            <span className="text-white font-bold block mb-1">JAIPUR</span>
            <span className="text-gray-400 text-[11px]">Lat: 26.9124 · Lon: 75.7873</span>
          </div>
          <div className="p-3 bg-[#0D1322] rounded-xl border border-gray-800/80">
            <span className="text-white font-bold block mb-1">DELHI</span>
            <span className="text-gray-400 text-[11px]">Lat: 28.6139 · Lon: 77.2090</span>
          </div>
          <div className="p-3 bg-[#0D1322] rounded-xl border border-gray-800/80">
            <span className="text-white font-bold block mb-1">MUMBAI</span>
            <span className="text-gray-400 text-[11px]">Lat: 19.0760 · Lon: 72.8777</span>
          </div>
        </div>

        <div className="pt-2 text-[11px] text-gray-500">
          <strong>Privacy Guarantee:</strong> This application never requests or records the visitor&apos;s GPS position via <code>navigator.geolocation</code>. All rendered markers represent validated civic observations within monitored jurisdictions.
        </div>
      </div>
    </div>
  );
}
