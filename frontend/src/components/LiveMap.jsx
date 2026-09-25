import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  RefreshCw,
  Clock,
  Navigation
} from 'lucide-react';
import { useCivicData } from '../context/CivicDataContext';

function formatRelativeTime(date) {
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

// Category colors for EPA AQI
const AQI_COLORS = {
  Good: '#10B981',
  Moderate: '#EAB308',
  'Unhealthy for Sensitive Groups': '#F97316',
  Unhealthy: '#EF4444',
  'Very Unhealthy': '#A855F7',
  Hazardous: '#DC2626'
};

export default function LiveMap({
  initialCity = 'all',
  height = '420px',
  onSelectCity
}) {
  const {
    cities,
    events,
    getCityAqi,
    getCityWeather,
    theme,
    lastUpdated,
    loading,
    refreshData
  } = useCivicData();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const cityMarkersGroupRef = useRef(null);
  const eventMarkersGroupRef = useRef(null);

  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [layers, setLayers] = useState({
    cities: true,
    airQuality: false,
    traffic: false,
    complaint: true
  });

  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [relTime, setRelTime] = useState(formatRelativeTime(lastUpdated));

  // Update relative time
  useEffect(() => {
    setRelTime(formatRelativeTime(lastUpdated));
    const timer = setInterval(() => {
      setRelTime(formatRelativeTime(lastUpdated));
    }, 10000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Sync initialCity prop if it changes
  useEffect(() => {
    if (initialCity) {
      setSelectedCity(initialCity);
    }
  }, [initialCity]);

  // 1. Initialize Map Once with standard OpenStreetMap (NO API KEY REQUIRED)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [24.5, 75.0],
      zoom: 6,
      zoomControl: false,
      attributionControl: true
    });

    // Simple compact zoom control in bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Standard OpenStreetMap tiles - Free, public, NO API key required
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);

    tileLayerRef.current = tiles;

    // Create Layer Groups
    cityMarkersGroupRef.current = L.layerGroup().addTo(map);
    eventMarkersGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size after layout mounts
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render City Markers (Default Primary View)
  useEffect(() => {
    if (!mapInstanceRef.current || !cityMarkersGroupRef.current) return;
    cityMarkersGroupRef.current.clearLayers();

    if (!layers.cities) return;
    const isLight = theme === 'light';

    cities.forEach((city) => {
      if (typeof city.latitude !== 'number' || typeof city.longitude !== 'number') return;
      if (selectedCity !== 'all' && city.name.toLowerCase() !== selectedCity.toLowerCase()) {
        return;
      }

      const aqiDetails = getCityAqi(city.name);
      const weatherDetails = getCityWeather(city.name);

      const aqiVal = aqiDetails?.aqi ?? '—';
      const aqiCat = aqiDetails?.aqiCategory || 'Data unavailable';
      const pm25Val = aqiDetails?.pm25 !== undefined ? `${aqiDetails.pm25} µg/m³` : 'N/A';
      const tempVal = weatherDetails?.temperature !== undefined ? `${weatherDetails.temperature}°C` : 'N/A';

      const status = aqiDetails?.status || 'OFFLINE';
      const isLive = status === 'LIVE';
      const isStale = status === 'STALE';
      const statusText = isLive ? 'LIVE' : isStale ? 'STALE' : 'OFFLINE';
      const statusDotColor = isLive ? '#10B981' : isStale ? '#F59E0B' : '#EF4444';

      const aqiColor = AQI_COLORS[aqiCat] || '#3B82F6';

      // Clean, restrained civic pill marker: 📍 Jaipur | AQI 149 | ● LIVE
      const iconHtml = `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: ${isLight ? '#FFFFFF' : '#111827'};
          color: ${isLight ? '#0F172A' : '#FFFFFF'};
          border: 1.5px solid ${isLight ? '#CBD5E1' : '#374151'};
          border-radius: 9999px;
          padding: 4px 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
          font-size: 11px;
          font-weight: 700;
          font-family: system-ui, sans-serif;
          white-space: nowrap;
          cursor: pointer;
          transform: translate(-50%, -50%);
        ">
          <span style="color: #3B82F6; font-size: 11px;">📍</span>
          <span style="font-weight: 800;">${city.name}</span>
          <span style="
            color: ${aqiColor};
            background: ${aqiColor}18;
            padding: 1px 6px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 11px;
            font-weight: 800;
          ">AQI ${aqiVal}</span>
          <span style="
            font-size: 10px;
            color: ${statusDotColor};
            font-weight: 800;
            text-transform: uppercase;
          ">
            ${statusText}
          </span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-city-marker',
        html: iconHtml,
        iconSize: [150, 28],
        iconAnchor: [75, 14]
      });

      const marker = L.marker([city.latitude, city.longitude], {
        icon: customIcon,
        zIndexOffset: 1000
      });

      // Compact, professional popup
      const popupHtml = `
        <div style="padding: 10px 12px; font-family: system-ui, sans-serif; min-width: 190px; line-height: 1.4;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; border-bottom: 1px solid ${isLight ? '#E2E8F0' : '#1F2937'}; padding-bottom: 4px;">
            <strong style="font-size: 13px; text-transform: uppercase;">📍 ${city.name}</strong>
            <span style="font-size: 10px; font-weight: 800; color: ${statusDotColor};">${statusText}</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
            <span style="font-size: 11px; color: ${isLight ? '#64748B' : '#9CA3AF'}; font-weight: 600;">AQI</span>
            <span style="font-size: 16px; font-weight: 900; font-family: monospace; color: ${aqiColor};">${aqiVal}</span>
          </div>

          <div style="font-size: 11px; font-weight: 700; color: ${aqiColor}; margin-bottom: 6px;">
            ${aqiCat}
          </div>

          <div style="font-size: 10px; font-family: monospace; color: ${isLight ? '#475569' : '#D1D5DB'}; margin-bottom: 6px;">
            <div>PM2.5: <strong>${pm25Val}</strong></div>
            <div>Temp: <strong>${tempVal}</strong></div>
          </div>

          <div style="font-size: 9px; color: ${isLight ? '#64748B' : '#9CA3AF'}; border-top: 1px solid ${isLight ? '#E2E8F0' : '#1F2937'}; padding-top: 4px; display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Source: Open-Meteo</span>
            <span>${formatRelativeTime(aqiDetails?.timestamp || weatherDetails?.timestamp)}</span>
          </div>

          <button
            style="width: 100%; padding: 4px 8px; font-size: 10px; font-weight: 700; color: #FFFFFF; background: #2563EB; border: none; border-radius: 4px; cursor: pointer;"
            onclick="window.location.hash = '#/city/${city.name.toLowerCase()}';"
          >
            View City Telemetry &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 240 });
      cityMarkersGroupRef.current.addLayer(marker);
    });
  }, [cities, getCityAqi, getCityWeather, layers.cities, selectedCity, theme]);

  // 3. Render Real Event Markers ONLY when non-city layers are explicitly enabled
  useEffect(() => {
    if (!mapInstanceRef.current || !eventMarkersGroupRef.current) return;
    eventMarkersGroupRef.current.clearLayers();

    // If no extra layers are enabled, do not render events
    if (!layers.airQuality && !layers.traffic && !layers.complaint) {
      return;
    }

    const isLight = theme === 'light';

    const validEvents = (events || []).filter(
      (e) =>
        typeof e.latitude === 'number' &&
        typeof e.longitude === 'number' &&
        !isNaN(e.latitude) &&
        !isNaN(e.longitude) &&
        e.latitude !== 0
    );

    validEvents.forEach((evt) => {
      if (selectedCity !== 'all' && evt.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return;
      }

      const src = (evt.source || '').toLowerCase();
      const type = (evt.eventType || '').toLowerCase();

      if (src === 'traffic' && !layers.traffic) return;
      if ((src === 'complaint' || src === 'citizen' || src === 'demo') && !layers.complaint) return;
      if ((src === 'open-meteo' || type.includes('aqi') || type.includes('pm2_5')) && !layers.airQuality) return;

      let markerColor = '#3B82F6';
      if (src === 'traffic') markerColor = '#F59E0B';
      if (src === 'complaint' || src === 'citizen' || src === 'demo') markerColor = '#8B5CF6';
      if (src === 'open-meteo') markerColor = '#06B6D4';
      if (evt.severity === 'high' || evt.severity === 'critical') markerColor = '#EF4444';

      // Simple clean circular dot marker
      const eventIconHtml = `
        <div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${markerColor};
          border: 2px solid ${isLight ? '#FFFFFF' : '#111827'};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transform: translate(-50%, -50%);
        "></div>
      `;

      const eventDivIcon = L.divIcon({
        className: 'custom-event-dot',
        html: eventIconHtml,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([evt.latitude, evt.longitude], {
        icon: eventDivIcon,
        zIndexOffset: 500
      });

      const isComplaint = src === 'complaint' || src === 'citizen' || src === 'demo' || Boolean(evt.metadata?.complaintId);
      const category = evt.metadata?.category || evt.eventType.replace(/_/g, ' ');
      const statusText = evt.metadata?.complaintStatus || evt.status || 'OPEN';
      const descText = evt.metadata?.description || '';

      const eventPopupHtml = isComplaint ? `
        <div style="padding: 8px 10px; font-family: system-ui, sans-serif; min-width: 200px; font-size: 11px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${isLight ? '#E2E8F0' : '#1F2937'}; padding-bottom: 4px; margin-bottom: 6px;">
            <strong style="text-transform: uppercase; color: #8B5CF6; font-size: 11px;">
              ${category}
            </strong>
            <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(139, 92, 246, 0.15); color: #8B5CF6; font-weight: 700;">
              ${statusText}
            </span>
          </div>

          <div style="color: ${isLight ? '#334155' : '#D1D5DB'}; margin-bottom: 6px; line-height: 1.4;">
            <div>City: <strong>${evt.city}</strong></div>
            ${descText ? `<div style="margin-top: 4px; font-size: 10px; color: ${isLight ? '#475569' : '#9CA3AF'}; font-style: italic;">"${descText.slice(0, 100)}${descText.length > 100 ? '...' : ''}"</div>` : ''}
          </div>

          <div style="font-size: 9px; color: ${isLight ? '#64748B' : '#9CA3AF'}; border-top: 1px solid ${isLight ? '#E2E8F0' : '#1F2937'}; padding-top: 4px;">
            Source: Citizen Report · ${new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ` : `
        <div style="padding: 8px 10px; font-family: system-ui, sans-serif; min-width: 180px; font-size: 11px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${isLight ? '#E2E8F0' : '#1F2937'}; padding-bottom: 4px; margin-bottom: 6px;">
            <strong style="text-transform: uppercase; color: ${markerColor}; font-size: 10px;">
              ${evt.eventType.replace(/_/g, ' ')}
            </strong>
            <span style="font-size: 9px; color: ${evt.isSynthetic ? '#F59E0B' : '#10B981'}; font-weight: 700;">
              ${evt.isSynthetic ? 'SIMULATED' : 'LIVE'}
            </span>
          </div>

          <div style="color: ${isLight ? '#334155' : '#D1D5DB'}; margin-bottom: 6px; line-height: 1.4;">
            <div>City: <strong>${evt.city}</strong></div>
            <div>Value: <strong>${evt.value} ${evt.unit || ''}</strong></div>
          </div>

          <div style="font-size: 9px; color: ${isLight ? '#64748B' : '#9CA3AF'}; border-top: 1px solid ${isLight ? '#E2E8F0' : '#1F2937'}; padding-top: 4px;">
            Source: ${evt.source} · ${new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      `;

      marker.bindPopup(eventPopupHtml, { maxWidth: 240 });
      eventMarkersGroupRef.current.addLayer(marker);
    });
  }, [events, selectedCity, layers, theme]);

  // 4. Fit Bounds on City Filter Change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (selectedCity === 'all') {
      const bounds = L.latLngBounds([
        [19.076, 72.8777], // Mumbai
        [26.9124, 75.7873], // Jaipur
        [28.6139, 77.209] // Delhi
      ]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 7 });
    } else {
      const cityMatch = cities.find(
        (c) => c.name.toLowerCase() === selectedCity.toLowerCase()
      );
      if (cityMatch && cityMatch.latitude && cityMatch.longitude) {
        map.flyTo([cityMatch.latitude, cityMatch.longitude], 12, {
          duration: 1.0
        });
      }
    }
  }, [selectedCity, cities]);

  const toggleLayer = (layerKey) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Compact Header / Toolbar */}
      <div className="px-4 py-2.5 bg-[#0D1322] border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Badge */}
          <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
            LIVE MAP
          </span>


          {/* City Selector Pills */}
          <div className="flex items-center bg-[#111827] border border-gray-800 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setSelectedCity('all')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                selectedCity === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Monitored
            </button>
            {cities.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedCity(c.name)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  selectedCity.toLowerCase() === c.name.toLowerCase()
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right Controls: Layers Dropdown & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Compact Layer Control */}
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="inline-flex items-center gap-1.5 bg-[#111827] hover:bg-gray-800 border border-gray-800 rounded-lg px-2.5 py-1 text-xs text-gray-300 font-medium cursor-pointer"
              title="Toggle Map Layers"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Layers</span>
            </button>

            {showLayerMenu && (
              <div className="absolute right-0 top-full mt-1 z-[1000] bg-[#111827] border border-gray-800 rounded-xl p-3 shadow-2xl text-xs space-y-2 min-w-[150px]">
                <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.cities}
                    onChange={() => toggleLayer('cities')}
                    className="rounded text-blue-600"
                  />
                  <span>Cities</span>
                </label>
                <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.airQuality}
                    onChange={() => toggleLayer('airQuality')}
                    className="rounded text-cyan-600"
                  />
                  <span>Air Quality</span>
                </label>
                <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.traffic}
                    onChange={() => toggleLayer('traffic')}
                    className="rounded text-amber-600"
                  />
                  <span>Traffic</span>
                </label>
                <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.complaint}
                    onChange={() => toggleLayer('complaint')}
                    className="rounded text-purple-600"
                  />
                  <span>Complaints</span>
                </label>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
            title="Refresh Map Data"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative w-full" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Small Professional Legend (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-[500] bg-[#111827]/90 backdrop-blur-sm border border-gray-800 rounded-lg px-2.5 py-1.5 text-[10px] shadow-md pointer-events-auto">
          <div className="flex items-center gap-2.5 text-gray-300 font-medium">
            <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Status</span>
            <span className="text-emerald-400 font-bold uppercase text-[9px]">Live</span>
            <span className="text-amber-400 font-bold uppercase text-[9px]">Stale</span>
            <span className="text-rose-400 font-bold uppercase text-[9px]">Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
