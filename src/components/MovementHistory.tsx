import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Clock, Info, Route, Trash2 } from 'lucide-react';
import { useAircraftStore } from '../store/aircraftStore';
import { formatLocalTime } from '../utils/freshness';

export const MovementHistory: React.FC = () => {
  const { selectedIcao, historyMap, clearHistoryForAircraft } = useAircraftStore();

  if (!selectedIcao) return null;

  const history = historyMap[selectedIcao] || [];

  const chartData = history.map((pt, idx) => ({
    index: idx + 1,
    time: formatLocalTime(pt.timestamp),
    altitude: pt.altitudeFeet || 0,
    speed: pt.velocityKts || 0,
    lat: pt.lat.toFixed(4),
    lng: pt.lng.toFixed(4),
  }));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono-atc text-xs font-bold uppercase tracking-wider text-slate-200">
            OBSERVED FLIGHT TRACK HISTORY
          </h3>
          <span className="text-[10px] font-mono-atc px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300">
            {history.length} waypoints
          </span>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => clearHistoryForAircraft(selectedIcao)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono-atc transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Mandatory Disclaimer from requirements */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>
          Note: This is application-collected session observation history, not guaranteed complete historical flight data from origin.
        </span>
      </div>

      {history.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono-atc text-slate-500">
          Awaiting position updates to build session flight profile.
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Recharts Altitude Profile Chart */}
          {history.length >= 2 && (
            <div>
              <div className="text-[11px] font-mono-atc text-slate-400 mb-2 flex items-center justify-between">
                <span>Altitude Profile (Feet AMSL)</span>
                <span className="text-cyan-400">
                  Current: {history[history.length - 1].altitudeFeet?.toLocaleString() ?? 'N/A'} ft
                </span>
              </div>
              <div className="h-32 w-full bg-slate-950/50 rounded-lg p-2 border border-slate-800/80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2 rounded text-xs font-mono-atc shadow-xl text-slate-200">
                              <div>Time: {data.time}</div>
                              <div className="text-cyan-400 font-bold">
                                Alt: {data.altitude.toLocaleString()} ft
                              </div>
                              <div className="text-slate-400">
                                Speed: {data.speed} kts
                              </div>
                              <div className="text-slate-500 text-[10px]">
                                {data.lat}, {data.lng}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="altitude"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#altGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chronological Breadcrumbs List */}
          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 divide-y divide-slate-850">
            {history
              .slice()
              .reverse()
              .map((pt, i) => (
                <div
                  key={pt.timestamp + '-' + i}
                  className="px-3 py-2 text-xs font-mono-atc flex items-center justify-between text-slate-300 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{formatLocalTime(pt.timestamp)}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">
                      {pt.lat.toFixed(4)}°, {pt.lng.toFixed(4)}°
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-300">
                      {pt.altitudeFeet !== null ? `${pt.altitudeFeet.toLocaleString()} ft` : 'N/A'}
                    </span>
                    <span className="text-slate-400">
                      {pt.velocityKts !== null ? `${pt.velocityKts} kts` : 'N/A'}
                    </span>
                    <span className="text-slate-500">
                      {pt.heading !== null ? `${Math.round(pt.heading)}°` : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
