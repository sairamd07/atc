import React from 'react';
import { useAircraftStore } from '../store/aircraftStore';
import { FreshnessFilter, GroundFilter } from '../types/aircraft';

export const AircraftFiltersBar: React.FC = () => {
  const { filters, setFilters, resetFilters } = useAircraftStore();

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.groundStatus !== 'all' ||
    filters.freshnessStatus !== 'all' ||
    filters.minAltitudeFt > 0 ||
    filters.maxAltitudeFt < 50000;

  return (
    <div className="space-y-3">
      <div className="label-tech text-[#1a1a1a]/70">Global Filter Config</div>

      {/* Brutalist Search Input */}
      <div className="relative">
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => setFilters({ searchQuery: e.target.value })}
          placeholder="CALLSIGN / ICAO / COUNTRY"
          className="w-full border-2 border-[#1a1a1a] bg-transparent p-2.5 sm:p-3 text-xs font-mono-tech font-bold uppercase text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 focus:outline-none focus:bg-white"
        />
        {filters.searchQuery && (
          <button
            onClick={() => setFilters({ searchQuery: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono-tech font-bold text-[#1a1a1a]"
          >
            [X]
          </button>
        )}
      </div>

      {/* Ground Filter Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {(['all', 'airborne', 'ground'] as GroundFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilters({ groundStatus: status })}
            className={`border-2 border-[#1a1a1a] px-2.5 py-1 text-[11px] font-mono-tech font-bold uppercase transition-all ${
              filters.groundStatus === status
                ? 'bg-[#1a1a1a] text-[#f2efeb]'
                : 'bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f2efeb]'
            }`}
          >
            {status === 'all' ? 'All Flight' : status === 'ground' ? 'Surface' : status}
          </button>
        ))}

        {/* Freshness Toggle */}
        <button
          onClick={() =>
            setFilters({
              freshnessStatus: filters.freshnessStatus === 'fresh' ? 'all' : 'fresh',
            })
          }
          className={`border-2 border-[#1a1a1a] px-2.5 py-1 text-[11px] font-mono-tech font-bold uppercase transition-all ${
            filters.freshnessStatus === 'fresh'
              ? 'bg-[#1a1a1a] text-[#f2efeb]'
              : 'bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f2efeb]'
          }`}
        >
          {filters.freshnessStatus === 'fresh' ? '● Live Only' : 'All Fresh'}
        </button>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className="border-2 border-[#d94e33] text-[#d94e33] hover:bg-[#d94e33] hover:text-white px-2.5 py-1 text-[11px] font-mono-tech font-bold uppercase transition-all"
          >
            Reset
          </button>
        )}
      </div>

      {/* Altitude Tier Buttons */}
      <div className="flex flex-wrap gap-1 pt-1 border-t border-[#1a1a1a]/10">
        <button
          onClick={() => setFilters({ minAltitudeFt: 0, maxAltitudeFt: 50000 })}
          className={`px-2 py-0.5 text-[10px] font-mono-tech border border-[#1a1a1a] uppercase ${
            filters.minAltitudeFt === 0 && filters.maxAltitudeFt === 50000
              ? 'bg-[#1a1a1a] text-[#f2efeb] font-bold'
              : 'bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a]/10'
          }`}
        >
          Any Alt
        </button>
        <button
          onClick={() => setFilters({ minAltitudeFt: 0, maxAltitudeFt: 10000 })}
          className={`px-2 py-0.5 text-[10px] font-mono-tech border border-[#1a1a1a] uppercase ${
            filters.minAltitudeFt === 0 && filters.maxAltitudeFt === 10000
              ? 'bg-[#1a1a1a] text-[#f2efeb] font-bold'
              : 'bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a]/10'
          }`}
        >
          &lt;10k ft
        </button>
        <button
          onClick={() => setFilters({ minAltitudeFt: 10000, maxAltitudeFt: 30000 })}
          className={`px-2 py-0.5 text-[10px] font-mono-tech border border-[#1a1a1a] uppercase ${
            filters.minAltitudeFt === 10000 && filters.maxAltitudeFt === 30000
              ? 'bg-[#1a1a1a] text-[#f2efeb] font-bold'
              : 'bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a]/10'
          }`}
        >
          10-30k ft
        </button>
        <button
          onClick={() => setFilters({ minAltitudeFt: 30000, maxAltitudeFt: 50000 })}
          className={`px-2 py-0.5 text-[10px] font-mono-tech border border-[#1a1a1a] uppercase ${
            filters.minAltitudeFt === 30000 && filters.maxAltitudeFt === 50000
              ? 'bg-[#1a1a1a] text-[#f2efeb] font-bold'
              : 'bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a]/10'
          }`}
        >
          &gt;30k ft
        </button>
      </div>
    </div>
  );
};
