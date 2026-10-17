import React, { useEffect, useState } from 'react';
import { useAircraftStore } from '../store/aircraftStore';
import { formatAge } from '../utils/freshness';

export const StatusStrip: React.FC = () => {
  const {
    isLiveMode,
    isAutoRefresh,
    pollingIntervalSeconds,
    rateLimitCountdown,
    error,
    lastSuccessfulUpdateLocalMs,
    aircraftMap,
    selectedRegion,
  } = useAircraftStore();

  const [utcTime, setUtcTime] = useState<string>('');
  const [timeAgo, setTimeAgo] = useState<string>('NEVER');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + ' UTC');

      if (lastSuccessfulUpdateLocalMs) {
        const sec = (Date.now() - lastSuccessfulUpdateLocalMs) / 1000;
        setTimeAgo(formatAge(sec).toUpperCase());
      } else {
        setTimeAgo('NEVER');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lastSuccessfulUpdateLocalMs]);

  const targetCount = Object.keys(aircraftMap).length;

  let statusText = 'NOMINAL_MONITORING';
  let statusColor = 'text-emerald-400';

  if (rateLimitCountdown > 0) {
    statusText = `PAUSED_BY_RATE_LIMIT (${rateLimitCountdown}S)`;
    statusColor = 'text-[#d94e33] animate-pulse';
  } else if (!isLiveMode) {
    statusText = 'SIMULATED_RADAR_MODE';
    statusColor = 'text-cyan-400';
  } else if (error) {
    statusText = 'OFFLINE_RETRYING';
    statusColor = 'text-amber-400';
  }

  return (
    <div className="bg-[#1a1a1a] text-[#f2efeb] px-6 lg:px-10 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-tech font-bold uppercase select-none tracking-wider">
      <div className="flex items-center gap-6 flex-wrap">
        <div>
          STATUS: <span className={statusColor}>{statusText}</span>
        </div>
        <div>TIME: <span>{utcTime}</span></div>
        <div>LAST_INGEST: <span>{timeAgo}</span></div>
      </div>

      <div className="flex items-center gap-6 flex-wrap">
        <div>SECTOR: <span className="text-cyan-300">{selectedRegion.name}</span></div>
        <div>TARGETS: <span className="text-[#d94e33]">{targetCount}</span></div>
      </div>
    </div>
  );
};
