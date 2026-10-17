import React from 'react';
import { useAircraftStore } from '../store/aircraftStore';
import { metersToFeet } from '../utils/aircraftParser';

export const StatCards: React.FC = () => {
  const { aircraftMap } = useAircraftStore();

  const aircraftList = Object.values(aircraftMap);
  const total = aircraftList.length;

  let airborne = 0;
  let ground = 0;
  let stale = 0;
  let climbing = 0;
  let descending = 0;

  for (const plane of aircraftList) {
    if (plane.onGround) {
      ground++;
    } else {
      airborne++;
    }

    if (plane.freshness === 'stale') {
      stale++;
    }

    if (plane.verticalRate !== null && !plane.onGround) {
      if (plane.verticalRate > 0.5) climbing++;
      else if (plane.verticalRate < -0.5) descending++;
    }
  }

  return (
    <div>
      <div className="label-tech text-[#1a1a1a]/70">Metrics Summary</div>
      <div className="grid grid-cols-2 gap-[1px] bg-[#1a1a1a] border border-[#1a1a1a] mt-2">
        {/* Tracks */}
        <div className="bg-[#f2efeb] p-3 sm:p-4 flex flex-col justify-between">
          <div className="label-tech text-[#1a1a1a]/80">Tracks</div>
          <div className="font-oswald text-3xl sm:text-4xl lg:text-5xl font-bold leading-none my-1 text-[#1a1a1a]">
            {total}
          </div>
          <div className="font-mono-tech text-[10px] text-[#1a1a1a]/60">Total in sector</div>
        </div>

        {/* Airborne */}
        <div className="bg-[#f2efeb] p-3 sm:p-4 flex flex-col justify-between">
          <div className="label-tech text-[#1a1a1a]/80">Airborne</div>
          <div className="font-oswald text-3xl sm:text-4xl lg:text-5xl font-bold leading-none my-1 text-[#d94e33]">
            {airborne}
          </div>
          <div className="font-mono-tech text-[10px] text-[#1a1a1a]/60">
            ↑{climbing} ↓{descending}
          </div>
        </div>

        {/* Surface */}
        <div className="bg-[#f2efeb] p-3 sm:p-4 flex flex-col justify-between">
          <div className="label-tech text-[#1a1a1a]/80">Surface</div>
          <div className="font-oswald text-3xl sm:text-4xl lg:text-5xl font-bold leading-none my-1 text-[#1a1a1a]">
            {ground}
          </div>
          <div className="font-mono-tech text-[10px] text-[#1a1a1a]/60">Runway & taxi</div>
        </div>

        {/* Stale */}
        <div className="bg-[#f2efeb] p-3 sm:p-4 flex flex-col justify-between">
          <div className="label-tech text-[#1a1a1a]/80">Stale</div>
          <div className="font-oswald text-3xl sm:text-4xl lg:text-5xl font-bold leading-none my-1 text-[#1a1a1a]">
            {stale}
          </div>
          <div className="font-mono-tech text-[10px] text-[#1a1a1a]/60">&gt;60s delay</div>
        </div>
      </div>
    </div>
  );
};
