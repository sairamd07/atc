import React from 'react';
import { useAircraftStore } from '../store/aircraftStore';
import {
  formatAltitudeFt,
  formatHeading,
  formatSpeedKts,
  formatVerticalRate,
  metersToFeet,
  mpsToKnots,
} from '../utils/aircraftParser';
import { formatAge } from '../utils/freshness';
import { formatCoordinates } from '../utils/geoBounds';

export const AircraftDetails: React.FC = () => {
  const {
    selectedIcao,
    setSelectedIcao,
    aircraftMap,
    historyMap,
    clearHistoryForAircraft,
  } = useAircraftStore();

  if (!selectedIcao) {
    return (
      <div className="space-y-3">
        <div className="label-tech text-[#1a1a1a]/70">Avionics Detail</div>
        <div className="py-8 text-center text-xs font-mono-tech opacity-50 uppercase tracking-widest text-[#1a1a1a]">
          -- NO TARGET SELECTED --
        </div>
      </div>
    );
  }

  const plane = aircraftMap[selectedIcao];
  const history = historyMap[selectedIcao] || [];

  if (!plane) {
    return (
      <div className="space-y-3">
        <div className="label-tech text-[#1a1a1a]/70">Avionics Detail</div>
        <div className="p-3 border-2 border-[#1a1a1a] bg-[#f2efeb] text-xs font-mono-tech space-y-2">
          <div className="text-[#d94e33] font-bold">[TARGET RETIRED FROM SECTOR]</div>
          <div className="text-[#1a1a1a]/80">ICAO: {selectedIcao.toUpperCase()}</div>
          <div className="text-[#1a1a1a]/60">{history.length} session waypoints preserved.</div>
          <button
            onClick={() => setSelectedIcao(null)}
            className="w-full mt-2 border-2 border-[#1a1a1a] py-1 text-xs font-bold uppercase hover:bg-[#1a1a1a] hover:text-[#f2efeb]"
          >
            Deselect Target
          </button>
        </div>
      </div>
    );
  }

  const ageSec = Math.floor(Date.now() / 1000) - (plane.timePosition ?? plane.lastContact);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="label-tech text-[#1a1a1a]/70">Avionics Detail</div>
        <button
          onClick={() => setSelectedIcao(null)}
          className="text-xs font-mono-tech font-bold uppercase text-[#1a1a1a]/70 hover:text-[#1a1a1a]"
        >
          [Deselect]
        </button>
      </div>

      {/* Target Header Card */}
      <div className="border-2 border-[#1a1a1a] bg-[#f2efeb] p-3 space-y-2">
        <div className="flex items-baseline justify-between border-b border-[#1a1a1a]/20 pb-2">
          <div>
            <div className="font-oswald text-2xl font-bold text-[#1a1a1a] leading-none uppercase">
              {plane.callsign || 'NO CALLSIGN'}
            </div>
            <div className="font-mono-tech text-[10px] text-[#1a1a1a]/60 uppercase tracking-wider mt-0.5">
              ICAO: {plane.icao24} • {plane.originCountry}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-1.5 py-0.5 text-[10px] font-mono-tech font-bold uppercase border border-[#1a1a1a] ${
                plane.freshness === 'fresh'
                  ? 'bg-[#1a1a1a] text-[#f2efeb]'
                  : plane.freshness === 'stale'
                  ? 'bg-amber-400 text-[#1a1a1a]'
                  : 'bg-[#d94e33] text-white'
              }`}
            >
              {plane.onGround ? 'SURFACE' : plane.freshness.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Squawk emergency alert if 7700 / 7600 */}
        {plane.squawk && (plane.squawk === '7700' || plane.squawk === '7600') && (
          <div className="bg-[#d94e33] text-white px-2 py-1 text-[10px] font-mono-tech font-bold uppercase animate-pulse">
            EMERGENCY SQUAWK: {plane.squawk}
          </div>
        )}

        {/* Avionics Spec Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-xs font-mono-tech pt-1">
          <div className="p-1.5 border border-[#1a1a1a]/20 bg-white/40">
            <div className="text-[9px] uppercase text-[#1a1a1a]/60">Altitude</div>
            <div className="font-bold text-[#1a1a1a]">{formatAltitudeFt(plane.baroAltitude)}</div>
          </div>

          <div className="p-1.5 border border-[#1a1a1a]/20 bg-white/40">
            <div className="text-[9px] uppercase text-[#1a1a1a]/60">Speed</div>
            <div className="font-bold text-[#1a1a1a]">{formatSpeedKts(plane.velocity)}</div>
          </div>

          <div className="p-1.5 border border-[#1a1a1a]/20 bg-white/40">
            <div className="text-[9px] uppercase text-[#1a1a1a]/60">Heading</div>
            <div className="font-bold text-[#1a1a1a]">{formatHeading(plane.trueTrack)}</div>
          </div>

          <div className="p-1.5 border border-[#1a1a1a]/20 bg-white/40">
            <div className="text-[9px] uppercase text-[#1a1a1a]/60">Vertical Rate</div>
            <div className="font-bold text-[#1a1a1a]">{formatVerticalRate(plane.verticalRate)}</div>
          </div>

          <div className="p-1.5 border border-[#1a1a1a]/20 bg-white/40">
            <div className="text-[9px] uppercase text-[#1a1a1a]/60">Transponder</div>
            <div className="font-bold text-[#1a1a1a]">SQ {plane.squawk || 'N/A'}</div>
          </div>

          <div className="p-1.5 border border-[#1a1a1a]/20 bg-white/40">
            <div className="text-[9px] uppercase text-[#1a1a1a]/60">Ping Age</div>
            <div className="font-bold text-[#1a1a1a]">{formatAge(ageSec)}</div>
          </div>
        </div>

        {/* Position coordinates */}
        <div className="p-1.5 border border-[#1a1a1a]/20 bg-white/40 text-[10px] font-mono-tech">
          <span className="text-[#1a1a1a]/60 uppercase">POS: </span>
          <span className="font-bold">{formatCoordinates(plane.latitude, plane.longitude)}</span>
        </div>

        {/* Session Track Breadcrumbs Info */}
        <div className="flex items-center justify-between pt-1 border-t border-[#1a1a1a]/20 text-[10px] font-mono-tech">
          <span className="text-[#1a1a1a]/70">Track: {history.length} waypoints</span>
          {history.length > 0 && (
            <button
              onClick={() => clearHistoryForAircraft(selectedIcao)}
              className="text-[#d94e33] hover:underline font-bold uppercase"
            >
              Clear Track
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
