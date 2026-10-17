import React from 'react';
import { REGION_PRESETS } from '../utils/geoBounds';
import { useAircraftStore } from '../store/aircraftStore';

interface DashboardHeaderProps {
  onManualRefresh: () => void;
  onOpenCustomBounds: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onManualRefresh,
  onOpenCustomBounds,
}) => {
  const {
    isLiveMode,
    setLiveMode,
    isAutoRefresh,
    setAutoRefresh,
    pollingIntervalSeconds,
    setPollingInterval,
    isLoading,
    rateLimitCountdown,
    selectedRegion,
    setRegion,
    customBounds,
  } = useAircraftStore();

  const isRateLimited = rateLimitCountdown > 0;

  return (
    <header className="border-b-2 border-[#1a1a1a] bg-[#f2efeb] px-6 lg:px-10 py-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 select-none">
      {/* Brand Title */}
      <div>
        <div className="label-tech text-[#1a1a1a]/70 tracking-widest">[ AIRSPACE SURVEILLANCE ]</div>
        <h1 className="font-oswald text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-[#1a1a1a] leading-none mt-1">
          CONTROL_SURFACE_RADAR
        </h1>
      </div>

      {/* Sector Selection & Quick Controls */}
      <div className="flex flex-wrap items-end gap-3 w-full md:w-auto justify-between md:justify-end">
        {/* Sector Dropdown */}
        <div className="flex flex-col items-start md:items-end">
          <div className="label-tech text-[#1a1a1a]/70">Sector Selection</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <select
              value={customBounds ? 'custom' : selectedRegion.id}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  onOpenCustomBounds();
                } else {
                  const reg = REGION_PRESETS.find((r) => r.id === e.target.value);
                  if (reg) setRegion(reg);
                }
              }}
              className="font-mono-tech font-bold text-xs sm:text-sm bg-transparent border-b-2 border-[#1a1a1a] pb-1 focus:outline-none cursor-pointer text-[#1a1a1a]"
            >
              {REGION_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id} className="bg-[#f2efeb] text-[#1a1a1a]">
                  {preset.name}
                </option>
              ))}
              <option value="custom" className="bg-[#f2efeb] text-[#d94e33]">
                {customBounds ? '[CUSTOM BOUNDS ACTIVE]' : '+ Define Custom Bounds...'}
              </option>
            </select>

            <button
              onClick={onOpenCustomBounds}
              title="Configure custom coordinates"
              className="border-2 border-[#1a1a1a] bg-transparent hover:bg-[#1a1a1a] hover:text-[#f2efeb] px-2 py-0.5 text-xs font-mono-tech font-bold uppercase transition-colors"
            >
              Bounds
            </button>
          </div>
        </div>

        {/* Action Button Group */}
        <div className="flex items-center gap-2">
          {/* Mode Switch (Live vs Sim) */}
          <button
            onClick={() => setLiveMode(!isLiveMode)}
            className={`border-2 border-[#1a1a1a] px-3 py-1.5 text-xs font-mono-tech font-bold uppercase transition-all ${
              !isLiveMode
                ? 'bg-[#1a1a1a] text-[#f2efeb]'
                : 'bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f2efeb]'
            }`}
          >
            {isLiveMode ? 'Sim Mode' : 'Go Live'}
          </button>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!isAutoRefresh)}
            className={`border-2 border-[#1a1a1a] px-3 py-1.5 text-xs font-mono-tech font-bold uppercase transition-all ${
              isAutoRefresh
                ? 'bg-[#1a1a1a] text-[#f2efeb]'
                : 'bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f2efeb]'
            }`}
          >
            Auto: {isAutoRefresh ? `${pollingIntervalSeconds}s` : 'Off'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={onManualRefresh}
            disabled={isLoading || isRateLimited}
            className={`border-2 border-[#1a1a1a] px-3 py-1.5 text-xs font-mono-tech font-bold uppercase transition-all ${
              isLoading || isRateLimited
                ? 'opacity-40 cursor-not-allowed bg-transparent text-[#1a1a1a]'
                : 'bg-[#d94e33] text-white border-[#d94e33] hover:bg-[#1a1a1a] hover:border-[#1a1a1a]'
            }`}
          >
            {isRateLimited ? `Wait ${rateLimitCountdown}s` : isLoading ? 'Polling...' : 'Refresh'}
          </button>
        </div>
      </div>
    </header>
  );
};
