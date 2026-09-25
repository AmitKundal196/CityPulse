import React from 'react';
import { MapPin } from 'lucide-react';

export default function DataSourcesBanner({ citiesStatus = {} }) {
  const cityNames = Object.keys(citiesStatus).length > 0
    ? Object.keys(citiesStatus)
    : ['Jaipur', 'Delhi', 'Mumbai'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="text-xs font-bold tracking-wider text-emerald-500 uppercase">
            LIVE
          </span>
        );
      case 'STALE':
        return (
          <span className="text-xs font-bold tracking-wider text-amber-400 uppercase">
            STALE
          </span>
        );
      case 'SIMULATED':
        return (
          <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">
            SIMULATED
          </span>
        );
      case 'OFFLINE':
      case 'DEGRADED':
        return (
          <span className="text-xs font-bold tracking-wider text-rose-500 uppercase">
            OFFLINE
          </span>
        );
      case 'NO_REPORTS':
        return (
          <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
            NO REPORTS
          </span>
        );
      case 'NOT_CONFIGURED':
      default:
        return (
          <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
            NOT CONFIGURED
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-[#131B2E] border border-gray-800 rounded-2xl p-6 shadow-xl mb-8">
      <div className="mb-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            CITY PULSE — DATA SOURCES
          </h2>
          <p className="text-xs text-gray-400">Multi-city real-time feed connectivity matrix</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider bg-gray-900/40">
              <th className="py-3 px-4 font-semibold">City</th>
              <th className="py-3 px-4 font-semibold">Weather</th>
              <th className="py-3 px-4 font-semibold">Air Quality</th>
              <th className="py-3 px-4 font-semibold">Traffic</th>
              <th className="py-3 px-4 font-semibold">Complaints</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-sm">
            {cityNames.map((cityName) => {
              const feeds = citiesStatus[cityName] || {};
              return (
                <tr key={cityName} className="hover:bg-gray-900/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    {cityName}
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(feeds.weather)}</td>
                  <td className="py-3.5 px-4">{getStatusBadge(feeds.air_quality)}</td>
                  <td className="py-3.5 px-4">{getStatusBadge(feeds.traffic)}</td>
                  <td className="py-3.5 px-4">{getStatusBadge(feeds.complaint)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
