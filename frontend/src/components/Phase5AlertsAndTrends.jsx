import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BellRing,
  History,
  LineChart,
  ShieldAlert,
  Clock,
  Info
} from 'lucide-react';
import { fetchHistory } from '../services/api';

const SEVERITY_BADGES = {
  INFO: 'bg-blue-900/50 text-blue-300 border-blue-700/60',
  WARNING: 'bg-amber-900/50 text-amber-300 border-amber-700/60',
  HIGH: 'bg-orange-900/50 text-orange-300 border-orange-700/60',
  CRITICAL: 'bg-rose-900/50 text-rose-300 border-rose-700/60'
};

const SEVERITY_BORDERS = {
  INFO: 'border-blue-500/20 bg-blue-500/5',
  WARNING: 'border-amber-500/20 bg-amber-500/5',
  HIGH: 'border-orange-500/20 bg-orange-500/5',
  CRITICAL: 'border-rose-500/20 bg-rose-500/5'
};

export default function Phase5AlertsAndTrends({
  trends = {},
  activeAlerts = [],
  alertHistory = [],
  activeCities = ['Jaipur', 'Delhi', 'Mumbai']
}) {
  const [selectedChartCity, setSelectedChartCity] = useState('Delhi');
  const [selectedMetric, setSelectedMetric] = useState('aqi'); // 'aqi' | 'pm2_5' | 'temperature'
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingChart(true);
    fetchHistory(selectedChartCity, 24)
      .then(res => {
        if (!isMounted) return;
        setChartData(res.observations || []);
        setLoadingChart(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setChartData([]);
        setLoadingChart(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedChartCity]);

  // Format valid observations for the selected metric
  const validObservations = chartData
    .filter(o => o[selectedMetric] !== null && o[selectedMetric] !== undefined && !isNaN(o[selectedMetric]))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const renderTrendIcon = (direction) => {
    if (direction === 'INCREASING') return <TrendingUp className="w-4 h-4 text-rose-400" />;
    if (direction === 'DECREASING') return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    return <Minus className="w-4 h-4 text-blue-400" />;
  };

  const renderTrendBadge = (direction) => {
    if (direction === 'INCREASING') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <TrendingUp className="w-3 h-3" /> Deteriorating
        </span>
      );
    }
    if (direction === 'DECREASING') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <TrendingDown className="w-3 h-3" /> Improving
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Minus className="w-3 h-3" /> Stable
      </span>
    );
  };

  // SVG Chart Dimensions
  const svgWidth = 600;
  const svgHeight = 180;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  let points = [];
  let minVal = 0;
  let maxVal = 100;

  if (validObservations.length >= 2) {
    const values = validObservations.map(o => o[selectedMetric]);
    minVal = Math.floor(Math.min(...values) * 0.9);
    maxVal = Math.ceil(Math.max(...values) * 1.1) || 10;
    if (minVal === maxVal) maxVal = minVal + 10;

    const tMin = new Date(validObservations[0].timestamp).getTime();
    const tMax = new Date(validObservations[validObservations.length - 1].timestamp).getTime();
    const tSpan = tMax - tMin || 1;

    points = validObservations.map(o => {
      const t = new Date(o.timestamp).getTime();
      const x = padding.left + ((t - tMin) / tSpan) * (svgWidth - padding.left - padding.right);
      const y = svgHeight - padding.bottom - ((o[selectedMetric] - minVal) / (maxVal - minVal)) * (svgHeight - padding.top - padding.bottom);
      return { x, y, val: o[selectedMetric], time: o.timestamp };
    });
  }

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="mb-8 space-y-6" id="phase5-alerts-trends-section">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3 h-3" />
            Phase 5 — Alerts, Trends & Historical Analysis
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            City Pulse Alert & Trend Layer
          </h2>
        </div>
        <div className="text-xs text-gray-400 font-mono">
          Empirical Delta Calculations · No Predictive AI
        </div>
      </div>

      {/* SECTION 1: RECENT TRENDS */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LineChart className="w-3.5 h-3.5 text-indigo-400" />
          Recent Trends (Available Observation Window)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeCities.map(cityName => {
            const cityTrend = trends[cityName] || trends[cityName.toLowerCase()] || {};
            const hasData = cityTrend.trend && cityTrend.trend !== 'INSUFFICIENT_DATA';

            return (
              <div
                key={cityName}
                className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
                    <span className="font-bold text-white text-base">{cityName}</span>
                    {hasData ? (
                      renderTrendBadge(cityTrend.trend)
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Insufficient Data</span>
                    )}
                  </div>

                  {hasData ? (
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-400">Current AQI:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-white">{cityTrend.currentAqi}</span>
                          <span className="text-xs text-gray-400">
                            (was {cityTrend.previousAqi})
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-300 leading-relaxed bg-black/25 p-2.5 rounded-xl border border-white/5">
                        {cityTrend.description}
                      </div>

                      {cityTrend.pm25Trend && (
                        <div className="text-[11px] text-gray-400 font-mono flex items-center justify-between pt-1 border-t border-white/5">
                          <span>PM2.5 Delta:</span>
                          <span className="text-gray-200">
                            {cityTrend.pm25Trend.start} → {cityTrend.pm25Trend.end} µg/m³ ({cityTrend.pm25Trend.delta > 0 ? `+${cityTrend.pm25Trend.delta}` : cityTrend.pm25Trend.delta})
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-gray-500 italic flex flex-col items-center gap-1.5">
                      <Info className="w-4 h-4 text-gray-600" />
                      Not enough observations for trend analysis.
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 flex items-center justify-between">
                  <span>Window: {cityTrend.window || 'Last 6 hours'}</span>
                  <span>Open-Meteo Air Quality</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2 & 4: ACTIVE ALERTS & TREND VISUALIZATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACTIVE ALERTS */}
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-400" />
                Active Alerts
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                {activeAlerts.length} Active
              </span>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-500 italic flex flex-col items-center gap-2">
                <Info className="w-5 h-5 text-gray-600" />
                No active threshold crossing alerts currently triggered.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {activeAlerts.map((alert, idx) => {
                  const sev = alert.severity || 'INFO';
                  const borderClass = SEVERITY_BORDERS[sev] || SEVERITY_BORDERS.INFO;
                  const badgeClass = SEVERITY_BADGES[sev] || SEVERITY_BADGES.INFO;

                  return (
                    <div
                      key={alert._id || idx}
                      className={`p-3 rounded-xl border ${borderClass} transition-all`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-white">
                          {alert.title}
                        </span>
                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded border shrink-0 ${badgeClass}`}>
                          {sev}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 leading-relaxed mb-2">
                        {alert.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1 border-t border-white/5">
                        <span>
                          {alert.value !== null && alert.value !== undefined ? `Value: ${alert.value} ${alert.unit || ''}` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-2 border-t border-gray-800 text-[10px] text-gray-500 flex items-center justify-between">
            <span>Deterministic Threshold Triggers</span>
            <span>Real Data Provenance</span>
          </div>
        </div>

        {/* TREND VISUALIZATION (CHARTS) */}
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between border-b border-gray-800 pb-3 mb-3 gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <LineChart className="w-4 h-4 text-indigo-400" />
                Historical Trend Chart
              </h3>

              <div className="flex items-center gap-1.5">
                {/* City selector */}
                <div className="flex rounded-lg bg-gray-800/80 p-0.5 border border-gray-700">
                  {activeCities.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedChartCity(c)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-all ${
                        selectedChartCity === c ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Metric selector */}
                <div className="flex rounded-lg bg-gray-800/80 p-0.5 border border-gray-700">
                  <button
                    onClick={() => setSelectedMetric('aqi')}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-all ${
                      selectedMetric === 'aqi' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    AQI
                  </button>
                  <button
                    onClick={() => setSelectedMetric('pm2_5')}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-all ${
                      selectedMetric === 'pm2_5' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    PM2.5
                  </button>
                  <button
                    onClick={() => setSelectedMetric('temperature')}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-all ${
                      selectedMetric === 'temperature' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Temp
                  </button>
                </div>
              </div>
            </div>

            {loadingChart ? (
              <div className="h-[180px] flex items-center justify-center text-xs text-gray-500">
                Loading observations...
              </div>
            ) : validObservations.length < 2 ? (
              <div className="h-[180px] flex flex-col items-center justify-center text-xs text-gray-500 gap-1.5 italic">
                <Info className="w-5 h-5 text-gray-600" />
                Not enough historical observations
              </div>
            ) : (
              <div className="relative">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-[180px] overflow-visible"
                >
                  {/* Grid Lines */}
                  <line
                    x1={padding.left}
                    y1={padding.top}
                    x2={svgWidth - padding.right}
                    y2={padding.top}
                    stroke="#374151"
                    strokeDasharray="3 3"
                    strokeWidth="0.8"
                  />
                  <line
                    x1={padding.left}
                    y1={svgHeight - padding.bottom}
                    x2={svgWidth - padding.right}
                    y2={svgHeight - padding.bottom}
                    stroke="#374151"
                    strokeDasharray="3 3"
                    strokeWidth="0.8"
                  />

                  {/* Y Axis Labels */}
                  <text
                    x={padding.left - 8}
                    y={padding.top + 4}
                    fill="#9CA3AF"
                    fontSize="9"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {maxVal}
                  </text>
                  <text
                    x={padding.left - 8}
                    y={svgHeight - padding.bottom + 2}
                    fill="#9CA3AF"
                    fontSize="9"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {minVal}
                  </text>

                  {/* Trend Path */}
                  <polyline
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylineStr}
                  />

                  {/* Data Points */}
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill="#818CF8"
                        stroke="#1E1B4B"
                        strokeWidth="1.5"
                      />
                      {/* Label for first and last point */}
                      {(i === 0 || i === points.length - 1) && (
                        <text
                          x={p.x}
                          y={p.y - 7}
                          fill="#E0E7FF"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {p.val}
                        </text>
                      )}
                    </g>
                  ))}

                  {/* X Axis Time Labels */}
                  {points.length > 0 && (
                    <>
                      <text
                        x={points[0].x}
                        y={svgHeight - 10}
                        fill="#9CA3AF"
                        fontSize="9"
                        textAnchor="start"
                        fontFamily="monospace"
                      >
                        {new Date(points[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </text>
                      <text
                        x={points[points.length - 1].x}
                        y={svgHeight - 10}
                        fill="#9CA3AF"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {new Date(points[points.length - 1].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </text>
                    </>
                  )}
                </svg>
              </div>
            )}
          </div>

          <div className="mt-4 pt-2 border-t border-gray-800 text-[10px] text-gray-500 flex items-center justify-between">
            <span>
              Y: {selectedMetric.toUpperCase()} ({selectedMetric === 'aqi' ? 'USAQI' : selectedMetric === 'pm2_5' ? 'µg/m³' : '°C'}) · X: Timestamp
            </span>
            <span>No extrapolation</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: ALERT HISTORY TABLE */}
      <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            Alert History (Recent Crossings)
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            {alertHistory.length} Recorded
          </span>
        </div>

        {alertHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500 italic">
            No historical alert records logged.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <th className="pb-2.5">Time</th>
                  <th className="pb-2.5">City</th>
                  <th className="pb-2.5">Alert</th>
                  <th className="pb-2.5">Value</th>
                  <th className="pb-2.5">Severity</th>
                  <th className="pb-2.5">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono text-[11px]">
                {alertHistory.slice(0, 10).map((alert, idx) => {
                  const sev = alert.severity || 'INFO';
                  const badgeClass = SEVERITY_BADGES[sev] || SEVERITY_BADGES.INFO;

                  return (
                    <tr key={alert._id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 text-gray-400">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 font-bold text-white">{alert.city}</td>
                      <td className="py-2.5 text-gray-200">{alert.title}</td>
                      <td className="py-2.5 text-gray-300">
                        {alert.value !== null && alert.value !== undefined ? `${alert.value} ${alert.unit || ''}` : '—'}
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${badgeClass}`}>
                          {sev}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-400 text-[10px]">{alert.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
