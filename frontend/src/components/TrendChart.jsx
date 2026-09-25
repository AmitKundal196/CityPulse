import React, { useState, useEffect } from 'react';
import { LineChart, Clock, Calendar, AlertCircle } from 'lucide-react';
import { fetchHistory } from '../services/api';

export default function TrendChart({
  city = 'Jaipur',
  initialMetric = 'aqi',
  allowMetricChange = true
}) {
  const [metric, setMetric] = useState(initialMetric);
  const [windowHours, setWindowHours] = useState(24);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchHistory(city, windowHours)
      .then((res) => {
        if (!mounted) return;
        setObservations(res.observations || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Trend fetch error:', err);
        if (!mounted) return;
        setObservations([]);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [city, windowHours]);

  // Filter observations matching the time window and having valid metric value
  const now = new Date().getTime();
  const windowMs = windowHours * 60 * 60 * 1000;

  const validData = observations
    .filter((o) => {
      const val = o[metric];
      if (val === null || val === undefined || isNaN(val)) return false;
      const t = new Date(o.timestamp).getTime();
      return now - t <= windowMs;
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const metricConfig = {
    aqi: { label: 'Air Quality Index', unit: 'AQI', color: '#3B82F6', stroke: '#60A5FA' },
    pm2_5: { label: 'PM2.5 Concentration', unit: 'µg/m³', color: '#F59E0B', stroke: '#FBBF24' },
    temperature: { label: 'Ambient Temperature', unit: '°C', color: '#EF4444', stroke: '#F87171' }
  };

  const activeConf = metricConfig[metric] || metricConfig.aqi;

  // SVG Chart Geometry
  const width = 640;
  const height = 220;
  const pad = { top: 25, right: 30, bottom: 40, left: 50 };

  let points = [];
  let minVal = 0;
  let maxVal = 100;

  if (validData.length >= 2) {
    const vals = validData.map((d) => d[metric]);
    minVal = Math.floor(Math.min(...vals) * 0.95);
    maxVal = Math.ceil(Math.max(...vals) * 1.05) || 10;
    if (minVal === maxVal) maxVal = minVal + 10;

    const tMin = new Date(validData[0].timestamp).getTime();
    const tMax = new Date(validData[validData.length - 1].timestamp).getTime();
    const tSpan = tMax - tMin || 1;

    points = validData.map((d) => {
      const t = new Date(d.timestamp).getTime();
      const x =
        pad.left +
        ((t - tMin) / tSpan) * (width - pad.left - pad.right);
      const y =
        height -
        pad.bottom -
        ((d[metric] - minVal) / (maxVal - minVal)) *
          (height - pad.top - pad.bottom);
      return { x, y, val: d[metric], time: d.timestamp };
    });
  }

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-xl">
      {/* Header with Metric & Time Window Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-bold text-white tracking-tight uppercase">
              {city} — {activeConf.label}
            </h4>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Empirical historical observations from real Open-Meteo feeds
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector (if enabled) */}
          {allowMetricChange && (
            <div className="flex items-center bg-[#0D1322] border border-gray-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setMetric('aqi')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  metric === 'aqi'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                AQI
              </button>
              <button
                onClick={() => setMetric('pm2_5')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  metric === 'pm2_5'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                PM2.5
              </button>
              <button
                onClick={() => setMetric('temperature')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  metric === 'temperature'
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Temp
              </button>
            </div>
          )}

          {/* Time Window Buttons */}
          <div className="flex items-center bg-[#0D1322] border border-gray-800 rounded-lg p-0.5 text-xs">
            {[1, 6, 24].map((h) => (
              <button
                key={h}
                onClick={() => setWindowHours(h)}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  windowHours === h
                    ? 'bg-gray-800 text-blue-400 font-bold border border-gray-700'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {h}H
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      {loading ? (
        <div className="h-52 flex flex-col items-center justify-center text-gray-500 text-xs">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
          Synchronizing historical records...
        </div>
      ) : validData.length < 2 ? (
        <div className="h-52 flex flex-col items-center justify-center text-gray-500 text-xs gap-2 bg-[#0D1322]/50 rounded-xl border border-gray-800/60 p-4">
          <AlertCircle className="w-5 h-5 text-gray-400" />
          <span className="font-semibold text-gray-400">
            Insufficient historical observations for {windowHours}H window
          </span>
          <p className="text-[11px] text-gray-500 text-center max-w-sm">
            The platform only renders authentic historical observations without synthetic interpolations. Check back as more real-time points accumulate.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Hover Tooltip Overlay */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none z-20 bg-gray-900 border border-gray-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl"
              style={{
                left: `${Math.min(Math.max(hoveredPoint.x - 40, 10), width - 120)}px`,
                top: `${Math.max(hoveredPoint.y - 45, 5)}px`
              }}
            >
              <div className="font-bold">
                {hoveredPoint.val} {activeConf.unit}
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                {new Date(hoveredPoint.time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          )}

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible select-none"
          >
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y =
                height -
                pad.bottom -
                ratio * (height - pad.top - pad.bottom);
              const val = Math.round(minVal + ratio * (maxVal - minVal));
              return (
                <g key={i}>
                  <line
                    x1={pad.left}
                    y1={y}
                    x2={width - pad.right}
                    y2={y}
                    stroke="#1F2937"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={pad.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#6B7280"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Time Axis Labels */}
            {points.length > 0 && (
              <>
                <text
                  x={pad.left}
                  y={height - pad.bottom + 20}
                  textAnchor="start"
                  fill="#6B7280"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {new Date(points[0].time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </text>
                <text
                  x={width - pad.right}
                  y={height - pad.bottom + 20}
                  textAnchor="end"
                  fill="#6B7280"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {new Date(points[points.length - 1].time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </text>
              </>
            )}

            {/* Area gradient under line */}
            <defs>
              <linearGradient id={`grad-${city}-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeConf.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={activeConf.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {points.length >= 2 && (
              <polygon
                points={`
                  ${points[0].x},${height - pad.bottom} 
                  ${polylineStr} 
                  ${points[points.length - 1].x},${height - pad.bottom}
                `}
                fill={`url(#grad-${city}-${metric})`}
              />
            )}

            {/* Trend Polyline */}
            <polyline
              fill="none"
              stroke={activeConf.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylineStr}
            />

            {/* Observation circles with hover listener */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#111827"
                stroke={activeConf.stroke}
                strokeWidth="2"
                className="transition-transform hover:r-6 cursor-pointer"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </svg>
        </div>
      )}

      {/* Footer Details */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-800 text-[11px] text-gray-500">
        <span>Unit: {activeConf.unit}</span>
        <span>
          Showing {validData.length} observation{validData.length !== 1 ? 's' : ''} in past {windowHours}h
        </span>
      </div>
    </div>
  );
}
