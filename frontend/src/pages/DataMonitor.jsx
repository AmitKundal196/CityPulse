import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { fetchSystemStatus, fetchEvents, fetchCities, fetchFeedStatuses, fetchInsights, fetchTrends, fetchAlerts, triggerSystemRefresh } from '../services/api';
import DataSourcesBanner from '../components/DataSourcesBanner';
import AqiSummaryCard from '../components/AqiSummaryCard';

import Phase5AlertsAndTrends from '../components/Phase5AlertsAndTrends';
import EventsTable from '../components/EventsTable';

export default function DataMonitor() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [feedDetails, setFeedDetails] = useState([]);
  const [cities, setCities] = useState([]);
  const [events, setEvents] = useState([]);
  const [insights, setInsights] = useState([]);
  const [trends, setTrends] = useState({});
  const [alertsData, setAlertsData] = useState({ activeAlerts: [], history: [] });
  const [cityFilter, setCityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities().then(data => {
      if (Array.isArray(data)) setCities(data);
    });
  }, []);

  const loadData = async (triggerBackendPoll = false) => {
    setLoading(true);
    if (triggerBackendPoll) {
      await Promise.allSettled([
        triggerSystemRefresh(),
        new Promise((resolve) => setTimeout(resolve, 600))
      ]);
    }
    const statusData = await fetchSystemStatus();
    setSystemStatus(statusData);

    const feedsData = await fetchFeedStatuses();
    setFeedDetails(feedsData || []);

    const filterObj = { limit: 50 };
    if (cityFilter !== 'all') filterObj.city = cityFilter;
    if (sourceFilter !== 'all') filterObj.source = sourceFilter;
    if (zoneFilter !== 'all') filterObj.zone = zoneFilter;

    const eventsData = await fetchEvents(filterObj);
    setEvents(eventsData.events || []);

    const insightsData = await fetchInsights();
    setInsights(insightsData.insights || []);

    const [trendsRes, alertsRes] = await Promise.all([
      fetchTrends(),
      fetchAlerts()
    ]);
    setTrends(trendsRes.trends || {});
    setAlertsData(alertsRes || { activeAlerts: [], history: [] });

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, [cityFilter, sourceFilter, zoneFilter]);

  const citiesStatus = systemStatus?.cities || {};
  const activeCities = cities.length > 0 ? cities.map(c => c.name) : ['Jaipur', 'Delhi', 'Mumbai'];

  // Extract AQI details per city from feedDetails or events
  const getCityAqiDetails = (cityName) => {
    const match = feedDetails.find(f => f.city === cityName && f.source === 'air_quality');
    if (match && match.details) {
      const detailsObj = match.details.aqiData || match.details.openMeteoData || match.details;
      if (detailsObj && (detailsObj.aqi !== undefined || detailsObj.usAqi !== undefined || detailsObj.rawPM25 !== undefined || detailsObj.pm25 !== undefined)) {
        return {
          ...detailsObj,
          status: match.status || detailsObj.status || 'OFFLINE'
        };
      }
    }
    // Check if any recent event has AQI metadata for this city
    const aqEvent = events.find(
      e => e.city === cityName && (e.source === 'open-meteo' || e.source === 'air_quality') && (e.metadata?.aqi !== undefined || e.metadata?.usAqi !== undefined)
    );
    if (aqEvent && aqEvent.metadata) {
      return {
        ...aqEvent.metadata,
        status: aqEvent.metadata.status || 'LIVE'
      };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 sm:p-10 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Activity className="w-3.5 h-3.5" />
              Phase 3 — Data Normalization, Validation & Feed Health
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Neighborhood Pulse Monitor
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Multi-city live data collection with Open-Meteo U.S. AQI presentation.
            </p>
          </div>

          <button
            onClick={() => loadData(true)}
            id="refresh-monitor-btn"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/60 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer self-start md:self-auto active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing Stream...' : 'Refresh Stream'}
          </button>
        </div>

        {/* AQI Summary Cards per City */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            Air Quality Index (AQI) Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeCities.map(cityName => (
              <AqiSummaryCard
                key={cityName}
                cityName={cityName}
                aqiDetails={getCityAqiDetails(cityName)}
                feedStatus={citiesStatus[cityName]?.air_quality}
              />
            ))}
          </div>
        </div>


        {/* Phase 5 — Alerts, Trends & Historical Event Analysis */}
        <Phase5AlertsAndTrends
          trends={trends}
          activeAlerts={alertsData.activeAlerts || []}
          alertHistory={alertsData.history || []}
          activeCities={activeCities}
        />

        {/* Multi-City Data Sources Status Banner */}
        <DataSourcesBanner citiesStatus={citiesStatus} />

        {/* Multi-City Events Table Component */}
        <EventsTable
          events={events}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          zoneFilter={zoneFilter}
          setZoneFilter={setZoneFilter}
          cities={cities}
        />
      </div>
    </div>
  );
}
