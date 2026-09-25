import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchSystemStatus,
  fetchFeedStatuses,
  fetchCities,
  fetchEvents,
  fetchInsights,
  fetchTrends,
  fetchAlerts,
  triggerSystemRefresh
} from '../services/api';

const CivicDataContext = createContext(null);

export function CivicDataProvider({ children }) {
  const [systemStatus, setSystemStatus] = useState(null);
  const [feedDetails, setFeedDetails] = useState([]);
  const [cities, setCities] = useState([]);
  const [events, setEvents] = useState([]);
  const [insights, setInsights] = useState([]);
  const [trends, setTrends] = useState({});
  const [alertsData, setAlertsData] = useState({ activeAlerts: [], history: [] });
  const [activeCity, setActiveCity] = useState('Jaipur');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('np_theme') || 'dark';
  });

  // Synchronize document classes with active theme
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('np_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Initial load of static city metadata
  useEffect(() => {
    fetchCities()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCities(data);
        } else {
          setCities([
            { id: 'jaipur', name: 'Jaipur', latitude: 26.9124, longitude: 75.7873 },
            { id: 'delhi', name: 'Delhi', latitude: 28.6139, longitude: 77.209 },
            { id: 'mumbai', name: 'Mumbai', latitude: 19.076, longitude: 72.8777 }
          ]);
        }
      })
      .catch((err) => {
        console.error('Failed to load cities metadata:', err);
      });
  }, []);

  // Fetch all live operational feeds
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Trigger active backend ingestion poll with a smooth visual feedback window
      await Promise.allSettled([
        triggerSystemRefresh(),
        new Promise((resolve) => setTimeout(resolve, 600))
      ]);

      const [statusRes, feedsRes, eventsRes, insightsRes, trendsRes, alertsRes] =
        await Promise.allSettled([
          fetchSystemStatus(),
          fetchFeedStatuses(),
          fetchEvents({ limit: 100 }),
          fetchInsights(),
          fetchTrends(),
          fetchAlerts()
        ]);

      if (statusRes.status === 'fulfilled' && statusRes.value) {
        setSystemStatus(statusRes.value);
      }
      if (feedsRes.status === 'fulfilled' && feedsRes.value) {
        setFeedDetails(feedsRes.value);
      }
      if (eventsRes.status === 'fulfilled' && eventsRes.value) {
        setEvents(eventsRes.value.events || []);
      }
      if (insightsRes.status === 'fulfilled' && insightsRes.value) {
        setInsights(insightsRes.value.insights || []);
      }
      if (trendsRes.status === 'fulfilled' && trendsRes.value) {
        setTrends(trendsRes.value.trends || {});
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value) {
        setAlertsData(alertsRes.value || { activeAlerts: [], history: [] });
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Data refresh error:', err);
      setError('Unable to synchronize data streams. Displaying cached records.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and gentle 10s auto-refresh interval
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // City AQI extractor
  const getCityAqi = useCallback(
    (cityName) => {
      const match = feedDetails.find(
        (f) => f.city === cityName && f.source === 'air_quality'
      );
      if (match && match.details) {
        const d = match.details.aqiData || match.details.openMeteoData || match.details;
        if (
          d &&
          (d.aqi !== undefined ||
            d.usAqi !== undefined ||
            d.us_aqi !== undefined ||
            d.rawPM25 !== undefined ||
            d.pm25 !== undefined)
        ) {
          return {
            aqi: d.aqi ?? d.usAqi ?? d.us_aqi ?? d.usAqiPm25,
            aqiCategory: d.aqiCategory || 'Unknown',
            pm25: d.rawPM25 ?? d.pm25 ?? d.pm2_5,
            pm10: d.pm10,
            nitrogenDioxide: d.nitrogenDioxide,
            ozone: d.ozone,
            status: match.status || d.status || 'OFFLINE',
            timestamp: d.timestamp || d.sourceTimestamp,
            methodology: 'Open-Meteo Air Quality',
            source: 'Open-Meteo Air Quality'
          };
        }
      }

      // Fallback search in recent events
      const aqEvent = events.find(
        (e) =>
          e.city === cityName &&
          (e.source === 'open-meteo' || e.source === 'air_quality') &&
          e.metadata &&
          (e.metadata.aqi !== undefined || e.metadata.usAqi !== undefined)
      );

      if (aqEvent && aqEvent.metadata) {
        const m = aqEvent.metadata;
        return {
          aqi: m.aqi ?? m.usAqi ?? m.usAqiPm25 ?? aqEvent.value,
          aqiCategory: m.aqiCategory || 'Unknown',
          pm25: m.rawPM25 ?? m.pm25,
          pm10: m.pm10,
          nitrogenDioxide: m.nitrogenDioxide,
          ozone: m.ozone,
          status: m.status || 'LIVE',
          timestamp: aqEvent.timestamp || m.timestamp,
          methodology: 'Open-Meteo Air Quality',
          source: 'Open-Meteo Air Quality'
        };
      }

      return null;
    },
    [feedDetails, events]
  );

  // City Weather extractor
  const getCityWeather = useCallback(
    (cityName) => {
      const match = feedDetails.find(
        (f) => f.city === cityName && f.source === 'weather'
      );
      if (match && match.details) {
        const d = match.details.weatherData || match.details;
        if (d && (d.temperature !== undefined || d.humidity !== undefined)) {
          return {
            temperature: d.temperature,
            humidity: d.humidity,
            windSpeed: d.windSpeed,
            rain: d.rain ?? 0,
            weatherCode: d.weatherCode ?? 0,
            status: match.status || d.status || 'OFFLINE',
            timestamp: d.timestamp || d.sourceTimestamp,
            source: 'Open-Meteo Weather'
          };
        }
      }
      return null;
    },
    [feedDetails]
  );

  // Compute overall system health status
  const overallSystemStatus = (() => {
    if (!systemStatus?.cities) return 'OFFLINE';
    const cityVals = Object.values(systemStatus.cities);
    if (cityVals.length === 0) return 'OFFLINE';

    // If any air_quality or weather feed is OFFLINE, evaluate
    const aqStatuses = cityVals.map((c) => c.air_quality);
    if (aqStatuses.every((s) => s === 'LIVE')) return 'LIVE';
    if (aqStatuses.some((s) => s === 'STALE')) return 'STALE';
    if (aqStatuses.some((s) => s === 'LIVE')) return 'DEGRADED';
    return 'OFFLINE';
  })();

  const activeCitiesList =
    cities.length > 0
      ? cities.map((c) => c.name)
      : ['Jaipur', 'Delhi', 'Mumbai'];

  const value = {
    systemStatus,
    feedDetails,
    cities,
    activeCitiesList,
    events,
    insights,
    trends,
    alertsData,
    activeCity,
    setActiveCity,
    loading,
    lastUpdated,
    error,
    refreshData,
    getCityAqi,
    getCityWeather,
    overallSystemStatus,
    theme,
    setTheme,
    toggleTheme
  };

  return (
    <CivicDataContext.Provider value={value}>
      {children}
    </CivicDataContext.Provider>
  );
}

export function useCivicData() {
  const context = useContext(CivicDataContext);
  if (!context) {
    throw new Error('useCivicData must be used within a CivicDataProvider');
  }
  return context;
}
