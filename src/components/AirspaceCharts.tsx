import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAircraftStore } from '../store/aircraftStore';
import { metersToFeet } from '../utils/aircraftParser';

export const AirspaceCharts: React.FC = () => {
  const { aircraftMap } = useAircraftStore();
  const planes = Object.values(aircraftMap);

  if (planes.length === 0) {
    return (
      <div className="p-8 text-center font-mono-tech text-xs opacity-50">
        -- NO TELEMETRY AVAILABLE FOR SECTOR ANALYTICS --
      </div>
    );
  }

  const altitudeBands = [
    { band: 'Surface', count: 0 },
    { band: '<10k ft', count: 0 },
    { band: '10-20k', count: 0 },
    { band: '20-30k', count: 0 },
    { band: '30-40k', count: 0 },
    { band: '40k+', count: 0 },
  ];

  let climbing = 0;
  let level = 0;
  let descending = 0;
  let ground = 0;

  for (const p of planes) {
    if (p.onGround) {
      altitudeBands[0].count++;
      ground++;
    } else if (p.baroAltitude !== null) {
      const ft = metersToFeet(p.baroAltitude)!;
      if (ft < 10000) altitudeBands[1].count++;
      else if (ft < 20000) altitudeBands[2].count++;
      else if (ft < 30000) altitudeBands[3].count++;
      else if (ft < 40000) altitudeBands[4].count++;
      else altitudeBands[5].count++;

      if (p.verticalRate !== null) {
        if (p.verticalRate > 0.5) climbing++;
        else if (p.verticalRate < -0.5) descending++;
        else level++;
      } else {
        level++;
      }
    }
  }

  const stateData = [
    { name: 'Cruise (Level)', value: level, color: '#1a1a1a' },
    { name: 'Climbing', value: climbing, color: '#10b981' },
    { name: 'Descending', value: descending, color: '#d94e33' },
    { name: 'Surface', value: ground, color: '#71717a' },
  ].filter((item) => item.value > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#f2efeb]">
      {/* Altitude Stratification Bar Chart */}
      <div className="border-2 border-[#1a1a1a] bg-[#f2efeb] p-4">
        <div className="label-tech text-[#1a1a1a]/70">Sector Stratification</div>
        <h4 className="font-oswald text-lg font-bold uppercase text-[#1a1a1a] mt-0.5 mb-2">
          Altitude Distribution
        </h4>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={altitudeBands} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="band" stroke="#1a1a1a" fontSize={10} fontFamily="Space Mono" tickLine={false} />
              <YAxis stroke="#1a1a1a" fontSize={10} fontFamily="Space Mono" tickLine={false} allowDecimals={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1a1a1a] text-[#f2efeb] p-2 text-xs font-mono-tech border border-[#1a1a1a]">
                        <div className="font-bold">{data.band}</div>
                        <div>Aircraft: {data.count}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#1a1a1a" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flight Phase Profile */}
      <div className="border-2 border-[#1a1a1a] bg-[#f2efeb] p-4 flex flex-col justify-between">
        <div>
          <div className="label-tech text-[#1a1a1a]/70">Motion State Profile</div>
          <h4 className="font-oswald text-lg font-bold uppercase text-[#1a1a1a] mt-0.5 mb-2">
            Airspace Flight Phase
          </h4>
        </div>
        <div className="h-44 w-full flex items-center justify-between">
          <div className="h-full w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {stateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#1a1a1a" strokeWidth={1.5} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#1a1a1a] text-[#f2efeb] p-2 text-xs font-mono-tech border border-[#1a1a1a]">
                          <div className="font-bold">{data.name}</div>
                          <div>Aircraft: {data.value}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-1/2 space-y-1.5 text-xs font-mono-tech">
            {stateData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-[11px] border-b border-[#1a1a1a]/10 pb-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 border border-[#1a1a1a] shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate max-w-[90px]">{entry.name}</span>
                </div>
                <span className="font-bold text-[#1a1a1a]">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
