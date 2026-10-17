import React from 'react';
import { useAircraftStore } from '../store/aircraftStore';

interface StatusBannerProps {
  onRetry: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ onRetry }) => {
  const {
    error,
    rateLimitCountdown,
    isLiveMode,
    setLiveMode,
    aircraftMap,
  } = useAircraftStore();

  const aircraftCount = Object.keys(aircraftMap).length;

  // Rate-limited error footer
  if (rateLimitCountdown > 0 || (error && error.isRateLimit)) {
    return (
      <footer className="bg-[#d94e33] text-white px-6 lg:px-10 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono-tech font-bold uppercase select-none tracking-wider">
        <div>
          HTTP_429: Too Many Requests (OpenSky Rate Limit) — Next cycle in {rateLimitCountdown}s
        </div>
        <div className="flex items-center gap-4">
          <span>TRACKING: {aircraftCount} TARGETS</span>
          <button
            onClick={() => setLiveMode(false)}
            className="border-2 border-white bg-[#1a1a1a] text-white px-3 py-1 text-xs font-bold uppercase hover:bg-white hover:text-[#1a1a1a] transition-colors"
          >
            Switch to Demo
          </button>
        </div>
      </footer>
    );
  }

  // General error footer
  if (error) {
    return (
      <footer className="bg-[#d94e33] text-white px-6 lg:px-10 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono-tech font-bold uppercase select-none tracking-wider">
        <div className="truncate max-w-xl">
          FEED_STATUS: {error.message}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRetry}
            className="border-2 border-white bg-transparent text-white px-3 py-1 text-xs font-bold uppercase hover:bg-white hover:text-[#d94e33] transition-colors"
          >
            Retry Live
          </button>
          <button
            onClick={() => setLiveMode(false)}
            className="border-2 border-white bg-[#1a1a1a] text-white px-3 py-1 text-xs font-bold uppercase hover:bg-white hover:text-[#1a1a1a] transition-colors"
          >
            Use Demo Feed
          </button>
        </div>
      </footer>
    );
  }

  // Demo Mode Banner
  if (!isLiveMode) {
    return (
      <footer className="bg-[#1a1a1a] text-[#f2efeb] px-6 lg:px-10 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono-tech font-bold uppercase select-none tracking-wider border-t-2 border-[#1a1a1a]">
        <div>
          [SIMULATION_MODE]: Generating synthetic ADS-B telemetry vectors for offline evaluation.
        </div>
        <div className="flex items-center gap-4">
          <span>TRACKING: {aircraftCount} TARGETS</span>
          <button
            onClick={() => {
              setLiveMode(true);
              onRetry();
            }}
            className="border-2 border-[#d94e33] bg-[#d94e33] text-white px-3 py-1 text-xs font-bold uppercase hover:bg-transparent hover:text-[#f2efeb] transition-colors"
          >
            Go Live
          </button>
        </div>
      </footer>
    );
  }

  // Normal Nominal Live Footer
  return (
    <footer className="bg-[#1a1a1a] text-[#f2efeb] px-6 lg:px-10 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono-tech select-none tracking-wider border-t-2 border-[#1a1a1a]">
      <div className="opacity-75 uppercase">
        AIRSPACE_CONTROL // OPENSKY REST API // WGS-84 ADS-B
      </div>
      <div className="flex items-center gap-4 opacity-80 uppercase">
        <span>TRACKING: {aircraftCount} ACTIVE AIRFRAMES</span>
        <span>•</span>
        <span>NO RESTRICTIONS</span>
      </div>
    </footer>
  );
};
