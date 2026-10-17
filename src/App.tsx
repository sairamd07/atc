/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AircraftDetails } from './components/AircraftDetails';
import { AircraftFiltersBar } from './components/AircraftFilters';
import { AircraftMap } from './components/AircraftMap';
import { AircraftTable } from './components/AircraftTable';
import { AirspaceCharts } from './components/AirspaceCharts';
import { CustomBoundsModal } from './components/CustomBoundsModal';
import { DashboardHeader } from './components/DashboardHeader';
import { StatCards } from './components/StatCard';
import { StatusBanner } from './components/StatusBanner';
import { StatusStrip } from './components/StatusStrip';
import { useAircraftPolling } from './hooks/useAircraftPolling';
import { useAircraftStore } from './store/aircraftStore';

export default function App() {
  const { isFirstLoad, isLoading, setLiveMode, selectedRegion } = useAircraftStore();
  const { triggerManualRefresh } = useAircraftPolling();

  const [isCustomBoundsOpen, setIsCustomBoundsOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col bg-[#f2efeb] text-[#1a1a1a] overflow-x-hidden select-none font-sans">
      {/* 1. Header (Brutalist Brand & Quick Controls) */}
      <DashboardHeader
        onManualRefresh={triggerManualRefresh}
        onOpenCustomBounds={() => setIsCustomBoundsOpen(true)}
      />

      {/* 2. Technical Monospace Status Strip */}
      <StatusStrip />

      {/* 3. Main Split Layout */}
      {isFirstLoad && isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="label-tech text-[#1a1a1a]/70">[ RADAR INITIALIZATION ]</div>
          <h2 className="font-oswald text-4xl font-bold uppercase text-[#1a1a1a]">
            ACQUIRING AIRSPACE TELEMETRY...
          </h2>
          <p className="font-mono-tech text-xs text-[#1a1a1a]/60 max-w-md">
            Querying transponder feeds for {selectedRegion.name}. If external networks are delayed,
            you can load the simulation immediately.
          </p>
          <button
            onClick={() => setLiveMode(false)}
            className="border-2 border-[#1a1a1a] bg-[#1a1a1a] text-[#f2efeb] px-4 py-2 text-xs font-mono-tech font-bold uppercase hover:bg-transparent hover:text-[#1a1a1a]"
          >
            Load Simulated Radar
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[380px_1fr] overflow-hidden">
          {/* Left Sidebar */}
          <aside className="border-b-2 lg:border-b-0 lg:border-r-2 border-[#1a1a1a] flex flex-col overflow-y-auto bg-[#f2efeb] divide-y divide-[#1a1a1a]/15">
            {/* Section 1: Metrics Summary */}
            <div className="p-4 sm:p-5">
              <StatCards />
            </div>

            {/* Section 2: Global Filter Config */}
            <div className="p-4 sm:p-5">
              <AircraftFiltersBar />
            </div>

            {/* Section 3: Avionics Detail */}
            <div className="p-4 sm:p-5 flex-1">
              <AircraftDetails />
            </div>
          </aside>

          {/* Right Section: Map & Table / Analytics */}
          <section className="flex-1 flex flex-col overflow-hidden bg-[#e8e4df]">
            {showAnalytics ? (
              <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="p-3 bg-[#f2efeb] border-b-2 border-[#1a1a1a] flex items-center justify-between">
                  <div className="label-tech text-[#1a1a1a]">[ SECTOR ANALYTICS VIEW ]</div>
                  <button
                    onClick={() => setShowAnalytics(false)}
                    className="border-2 border-[#1a1a1a] px-3 py-1 text-xs font-mono-tech font-bold uppercase hover:bg-[#1a1a1a] hover:text-[#f2efeb]"
                  >
                    Return to Tactical Radar
                  </button>
                </div>
                <div className="p-4 flex-1">
                  <AirspaceCharts />
                </div>
                <div className="h-[280px] lg:h-[320px] overflow-hidden">
                  <AircraftTable />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tactical Radar Map Frame */}
                <div className="flex-1 min-h-[380px] lg:min-h-0 relative">
                  <AircraftMap
                    showAnalytics={showAnalytics}
                    onToggleAnalytics={() => setShowAnalytics(true)}
                  />
                </div>

                {/* Table Section */}
                <div className="h-[260px] sm:h-[300px] overflow-hidden">
                  <AircraftTable />
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* 4. Bottom Footer (Status / Error Banner) */}
      <StatusBanner onRetry={triggerManualRefresh} />

      {/* Custom Coordinates Modal */}
      <CustomBoundsModal
        isOpen={isCustomBoundsOpen}
        onClose={() => setIsCustomBoundsOpen(false)}
      />
    </div>
  );
}
