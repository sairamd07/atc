import { create } from 'zustand';
import {
  AircraftFilters,
  AircraftHistoryPoint,
  AircraftState,
  ApiErrorState,
  GeoBounds,
  RegionPreset,
} from '../types/aircraft';
import { metersToFeet, mpsToFpm, mpsToKnots } from '../utils/aircraftParser';
import { computeFreshness, MAX_CONSECUTIVE_MISSES } from '../utils/freshness';
import { DEFAULT_REGION } from '../utils/geoBounds';

const MAX_HISTORY_POINTS_PER_AIRCRAFT = 60;

interface AircraftStore {
  // Snapshot & Telemetry Data
  aircraftMap: Record<string, AircraftState>;
  historyMap: Record<string, AircraftHistoryPoint[]>;
  selectedIcao: string | null;

  // Region & Spatial Scope
  selectedRegion: RegionPreset;
  customBounds: GeoBounds | null;
  activeBounds: GeoBounds;

  // Connection & Polling State
  isLiveMode: boolean; // true = OpenSky REST API, false = Simulated Demo
  isAutoRefresh: boolean;
  pollingIntervalSeconds: number;
  isLoading: boolean;
  isFirstLoad: boolean;
  lastSuccessfulSnapshotTime: number | null; // API server time in seconds
  lastSuccessfulUpdateLocalMs: number | null; // Local epoch ms
  lastRequestDurationMs: number | null;

  // Rate Limiting & Errors
  error: ApiErrorState | null;
  rateLimitCountdown: number; // remaining seconds

  // Local UI Filters
  filters: AircraftFilters;

  // Actions
  processApiSnapshot: (incomingStates: AircraftState[], serverTimeSec: number, durationMs: number) => void;
  setSelectedIcao: (icao24: string | null) => void;
  setRegion: (region: RegionPreset) => void;
  setCustomBounds: (bounds: GeoBounds) => void;
  setLiveMode: (live: boolean) => void;
  setAutoRefresh: (auto: boolean) => void;
  setPollingInterval: (seconds: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApiErrorState | null) => void;
  clearError: () => void;
  decrementRateLimitCountdown: () => void;
  setFilters: (partial: Partial<AircraftFilters>) => void;
  resetFilters: () => void;
  clearHistoryForAircraft: (icao24: string) => void;
  clearAllHistory: () => void;
}

const defaultFilters: AircraftFilters = {
  searchQuery: '',
  minAltitudeFt: 0,
  maxAltitudeFt: 50000,
  minSpeedKts: 0,
  maxSpeedKts: 700,
  groundStatus: 'all',
  freshnessStatus: 'all',
  sortBy: 'callsign',
  sortDirection: 'asc',
};

export const useAircraftStore = create<AircraftStore>((set, get) => ({
  aircraftMap: {},
  historyMap: {},
  selectedIcao: null,

  selectedRegion: DEFAULT_REGION,
  customBounds: null,
  activeBounds: DEFAULT_REGION.bounds,

  isLiveMode: true,
  isAutoRefresh: true,
  pollingIntervalSeconds: 12,
  isLoading: false,
  isFirstLoad: true,
  lastSuccessfulSnapshotTime: null,
  lastSuccessfulUpdateLocalMs: null,
  lastRequestDurationMs: null,

  error: null,
  rateLimitCountdown: 0,

  filters: defaultFilters,

  processApiSnapshot: (incomingStates, serverTimeSec, durationMs) => {
    const state = get();

    // Prevent out-of-order or stale response overwrites
    if (state.lastSuccessfulSnapshotTime && serverTimeSec < state.lastSuccessfulSnapshotTime) {
      return;
    }

    const currentMap = { ...state.aircraftMap };
    const currentHistory = { ...state.historyMap };
    const seenIcaosInResponse = new Set<string>();
    const nowMs = Date.now();

    // 1. Ingest new / updated aircraft
    for (const incoming of incomingStates) {
      const icao = incoming.icao24;
      seenIcaosInResponse.add(icao);

      const existing = currentMap[icao];

      // Update aircraft with preserved firstSeen & reset consecutive misses
      const updated: AircraftState = {
        ...incoming,
        firstSeen: existing ? existing.firstSeen : nowMs,
        lastSeen: nowMs,
        consecutiveMisses: 0,
        freshness: computeFreshness(incoming, serverTimeSec),
      };

      currentMap[icao] = updated;

      // 2. Record position to session history if position is valid
      if (updated.latitude !== null && updated.longitude !== null) {
        const historyList = currentHistory[icao] ? [...currentHistory[icao]] : [];
        const lastPoint = historyList[historyList.length - 1];

        // Deduplication: only append if meaningful change occurred (> 0.0001 deg or > 200m or > 3s)
        const isDuplicate =
          lastPoint &&
          Math.abs(lastPoint.lat - updated.latitude) < 0.0001 &&
          Math.abs(lastPoint.lng - updated.longitude) < 0.0001 &&
          lastPoint.altitudeMeters === updated.baroAltitude;

        if (!isDuplicate) {
          const newPoint: AircraftHistoryPoint = {
            timestamp: nowMs,
            lat: updated.latitude,
            lng: updated.longitude,
            altitudeMeters: updated.baroAltitude,
            altitudeFeet: metersToFeet(updated.baroAltitude),
            velocityKts: mpsToKnots(updated.velocity),
            heading: updated.trueTrack,
            verticalRateFpm: mpsToFpm(updated.verticalRate),
          };

          historyList.push(newPoint);

          // Constrain history length to limit memory consumption
          if (historyList.length > MAX_HISTORY_POINTS_PER_AIRCRAFT) {
            historyList.shift();
          }

          currentHistory[icao] = historyList;
        }
      }
    }

    // 3. Lifecycle handling for departed aircraft:
    // Any aircraft in currentMap that was NOT seen in incoming response
    for (const icao of Object.keys(currentMap)) {
      if (!seenIcaosInResponse.has(icao)) {
        const missingAircraft = currentMap[icao];
        const misses = missingAircraft.consecutiveMisses + 1;

        if (misses >= MAX_CONSECUTIVE_MISSES) {
          // Retire from active snapshot, but its history in currentHistory is deliberately preserved
          delete currentMap[icao];
        } else {
          // Keep in snapshot but mark as stale/missing
          currentMap[icao] = {
            ...missingAircraft,
            consecutiveMisses: misses,
            freshness: 'stale',
          };
        }
      }
    }

    set({
      aircraftMap: currentMap,
      historyMap: currentHistory,
      isLoading: false,
      isFirstLoad: false,
      lastSuccessfulSnapshotTime: serverTimeSec,
      lastSuccessfulUpdateLocalMs: nowMs,
      lastRequestDurationMs: durationMs,
      error: null,
    });
  },

  setSelectedIcao: (icao24) => {
    set({ selectedIcao: icao24 });
  },

  setRegion: (region) => {
    set({
      selectedRegion: region,
      customBounds: null,
      activeBounds: region.bounds,
      // Clear current snapshot when changing region bounds to prevent cross-region ghost planes
      aircraftMap: {},
      selectedIcao: null,
      error: null,
    });
  },

  setCustomBounds: (bounds) => {
    set({
      customBounds: bounds,
      activeBounds: bounds,
      aircraftMap: {},
      selectedIcao: null,
      error: null,
    });
  },

  setLiveMode: (live) => {
    set({
      isLiveMode: live,
      error: null,
      rateLimitCountdown: 0,
      aircraftMap: {},
      selectedIcao: null,
    });
  },

  setAutoRefresh: (auto) => {
    set({ isAutoRefresh: auto });
  },

  setPollingInterval: (seconds) => {
    // Keep between 10s and 60s
    const clamped = Math.max(10, Math.min(60, seconds));
    set({ pollingIntervalSeconds: clamped });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set((state) => ({
      error,
      isLoading: false,
      rateLimitCountdown: error?.retryAfterSeconds || (error?.isRateLimit ? 30 : 0),
    }));
  },

  clearError: () => {
    set({ error: null, rateLimitCountdown: 0 });
  },

  decrementRateLimitCountdown: () => {
    set((state) => {
      if (state.rateLimitCountdown <= 0) return { rateLimitCountdown: 0 };
      const next = state.rateLimitCountdown - 1;
      return {
        rateLimitCountdown: next,
        // Clear rate-limit error banner when countdown finishes
        error: next === 0 && state.error?.isRateLimit ? null : state.error,
      };
    });
  },

  setFilters: (partial) => {
    set((state) => ({
      filters: { ...state.filters, ...partial },
    }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  clearHistoryForAircraft: (icao24) => {
    set((state) => {
      const nextHistory = { ...state.historyMap };
      delete nextHistory[icao24];
      return { historyMap: nextHistory };
    });
  },

  clearAllHistory: () => {
    set({ historyMap: {} });
  },
}));
