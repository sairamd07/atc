import React, { useMemo, useState } from 'react';
import { useAircraftStore } from '../store/aircraftStore';
import { SortColumn } from '../types/aircraft';
import {
  formatAltitudeFt,
  formatFlightLevel,
  formatHeading,
  formatSpeedKts,
  formatVerticalRate,
  metersToFeet,
  mpsToKnots,
} from '../utils/aircraftParser';
import { formatAge } from '../utils/freshness';

export const AircraftTable: React.FC = () => {
  const {
    aircraftMap,
    selectedIcao,
    setSelectedIcao,
    filters,
    setFilters,
    resetFilters,
  } = useAircraftStore();

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const filteredAndSortedList = useMemo(() => {
    let list = Object.values(aircraftMap);

    if (filters.groundStatus === 'airborne') {
      list = list.filter((p) => !p.onGround);
    } else if (filters.groundStatus === 'ground') {
      list = list.filter((p) => p.onGround);
    }

    if (filters.freshnessStatus === 'fresh') {
      list = list.filter((p) => p.freshness === 'fresh');
    } else if (filters.freshnessStatus === 'stale') {
      list = list.filter((p) => p.freshness === 'stale');
    }

    list = list.filter((p) => {
      if (p.baroAltitude === null) return true;
      const ft = metersToFeet(p.baroAltitude)!;
      return ft >= filters.minAltitudeFt && ft <= filters.maxAltitudeFt;
    });

    list = list.filter((p) => {
      if (p.velocity === null) return true;
      const kts = mpsToKnots(p.velocity)!;
      return kts >= filters.minSpeedKts && kts <= filters.maxSpeedKts;
    });

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      list = list.filter((p) => {
        const callsign = (p.callsign || '').toLowerCase();
        const icao = p.icao24.toLowerCase();
        const country = p.originCountry.toLowerCase();
        return callsign.includes(q) || icao.includes(q) || country.includes(q);
      });
    }

    list.sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      switch (filters.sortBy) {
        case 'callsign':
          valA = a.callsign || a.icao24;
          valB = b.callsign || b.icao24;
          break;
        case 'altitude':
          valA = a.baroAltitude ?? -1;
          valB = b.baroAltitude ?? -1;
          break;
        case 'speed':
          valA = a.velocity ?? -1;
          valB = b.velocity ?? -1;
          break;
        case 'heading':
          valA = a.trueTrack ?? -1;
          valB = b.trueTrack ?? -1;
          break;
        case 'lastContact':
          valA = a.lastContact;
          valB = b.lastContact;
          break;
        case 'icao24':
          valA = a.icao24;
          valB = b.icao24;
          break;
        case 'country':
          valA = a.originCountry;
          valB = b.originCountry;
          break;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return filters.sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return filters.sortDirection === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      }
    });

    return list;
  }, [aircraftMap, filters]);

  const totalPages = Math.ceil(filteredAndSortedList.length / rowsPerPage) || 1;
  const paginatedList = filteredAndSortedList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSort = (col: SortColumn) => {
    if (filters.sortBy === col) {
      setFilters({
        sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setFilters({
        sortBy: col,
        sortDirection: 'asc',
      });
    }
  };

  return (
    <div className="bg-[#f2efeb] border-t-2 border-[#1a1a1a] flex flex-col h-full overflow-hidden select-none">
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full border-collapse text-left text-xs font-mono-tech">
          <thead>
            <tr>
              <th
                onClick={() => handleSort('callsign')}
                className="py-2.5 px-4 bg-[#1a1a1a] text-[#f2efeb] uppercase font-bold cursor-pointer hover:bg-black transition-colors"
              >
                CALLSIGN
              </th>
              <th
                onClick={() => handleSort('icao24')}
                className="py-2.5 px-4 bg-[#1a1a1a] text-[#f2efeb] uppercase font-bold cursor-pointer hover:bg-black transition-colors"
              >
                ICAO24
              </th>
              <th
                onClick={() => handleSort('altitude')}
                className="py-2.5 px-4 bg-[#1a1a1a] text-[#f2efeb] uppercase font-bold cursor-pointer hover:bg-black transition-colors"
              >
                ALTITUDE
              </th>
              <th
                onClick={() => handleSort('speed')}
                className="py-2.5 px-4 bg-[#1a1a1a] text-[#f2efeb] uppercase font-bold cursor-pointer hover:bg-black transition-colors"
              >
                SPEED
              </th>
              <th className="py-2.5 px-4 bg-[#1a1a1a] text-[#f2efeb] uppercase font-bold hidden sm:table-cell">
                HEADING
              </th>
              <th className="py-2.5 px-4 bg-[#1a1a1a] text-[#f2efeb] uppercase font-bold">
                STATUS
              </th>
              <th
                onClick={() => handleSort('lastContact')}
                className="py-2.5 px-4 bg-[#1a1a1a] text-[#f2efeb] uppercase font-bold cursor-pointer hover:bg-black transition-colors text-right"
              >
                PING
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center font-mono-tech text-[#1a1a1a]">
                  <div className="label-tech text-[#1a1a1a]/70">Database Search: Null Result</div>
                  <div className="mt-1 text-xs opacity-50">No matching airframes in active sector.</div>
                  <button
                    onClick={resetFilters}
                    className="mt-3 border-2 border-[#1a1a1a] px-3 py-1 text-xs font-bold uppercase hover:bg-[#1a1a1a] hover:text-[#f2efeb]"
                  >
                    Reset Filters
                  </button>
                </td>
              </tr>
            ) : (
              paginatedList.map((plane) => {
                const isSelected = plane.icao24 === selectedIcao;
                const ageSec = Math.floor(Date.now() / 1000) - (plane.timePosition ?? plane.lastContact);

                return (
                  <tr
                    key={plane.icao24}
                    onClick={() => setSelectedIcao(plane.icao24)}
                    className={`cursor-pointer transition-colors border-b border-[#1a1a1a]/10 ${
                      isSelected
                        ? 'bg-[#1a1a1a] text-[#f2efeb]'
                        : 'hover:bg-[#1a1a1a]/5 text-[#1a1a1a]'
                    }`}
                  >
                    <td className="py-2 px-4 font-bold flex items-center gap-1.5">
                      <span>{plane.callsign || 'N/A'}</span>
                      {plane.squawk === '7700' && (
                        <span className="px-1 py-0.2 text-[9px] bg-[#d94e33] text-white font-bold">
                          EMG
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 uppercase opacity-75">{plane.icao24}</td>
                    <td className="py-2 px-4">
                      {plane.onGround
                        ? 'GND'
                        : `${formatFlightLevel(plane.baroAltitude)} (${formatAltitudeFt(plane.baroAltitude)})`}
                    </td>
                    <td className="py-2 px-4">{formatSpeedKts(plane.velocity)}</td>
                    <td className="py-2 px-4 hidden sm:table-cell">{formatHeading(plane.trueTrack)}</td>
                    <td className="py-2 px-4">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                          isSelected ? 'border-white text-white' : 'border-[#1a1a1a]'
                        } ${
                          plane.onGround
                            ? 'bg-transparent'
                            : plane.freshness === 'fresh'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {plane.onGround ? 'SURFACE' : plane.freshness.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right opacity-75">{formatAge(ageSec)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-2 border-t border-[#1a1a1a]/10 flex items-center justify-between text-xs font-mono-tech text-[#1a1a1a]/70">
          <div>
            Showing {(page - 1) * rowsPerPage + 1} -{' '}
            {Math.min(page * rowsPerPage, filteredAndSortedList.length)} of{' '}
            {filteredAndSortedList.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border border-[#1a1a1a] px-2 py-0.5 uppercase disabled:opacity-30"
            >
              Prev
            </button>
            <span className="font-bold">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border border-[#1a1a1a] px-2 py-0.5 uppercase disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
