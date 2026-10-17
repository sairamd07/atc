import { AircraftState, FreshnessStatus } from '../types/aircraft';

export const FRESHNESS_THRESHOLD_SECONDS = 60;
export const STALE_THRESHOLD_SECONDS = 180;
export const MAX_CONSECUTIVE_MISSES = 5; // Poll count before removal from active snapshot

export function computeFreshness(
  aircraft: AircraftState,
  currentTimeSec: number = Math.floor(Date.now() / 1000)
): FreshnessStatus {
  if (aircraft.latitude === null || aircraft.longitude === null) {
    return 'missing-position';
  }

  const refTime = aircraft.timePosition ?? aircraft.lastContact;
  const age = currentTimeSec - refTime;

  if (age < FRESHNESS_THRESHOLD_SECONDS) {
    return 'fresh';
  }
  return 'stale';
}

export function getFreshnessBadge(freshness: FreshnessStatus): {
  label: string;
  className: string;
  dotColor: string;
} {
  switch (freshness) {
    case 'fresh':
      return {
        label: 'LIVE',
        className: 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
        dotColor: 'bg-emerald-400',
      };
    case 'stale':
      return {
        label: 'STALE',
        className: 'bg-amber-950/80 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
        dotColor: 'bg-amber-400',
      };
    case 'missing-position':
      return {
        label: 'NO POS',
        className: 'bg-rose-950/80 text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.2)]',
        dotColor: 'bg-rose-400',
      };
  }
}

export function formatAge(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0s ago';
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;
  const mins = Math.floor(seconds / 60);
  const remSec = Math.floor(seconds % 60);
  if (mins < 60) return `${mins}m ${remSec}s ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
}

export function formatUtcTime(timestampMs: number | null): string {
  if (!timestampMs) return 'N/A';
  const d = new Date(timestampMs);
  return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

export function formatLocalTime(timestampMs: number | null): string {
  if (!timestampMs) return 'N/A';
  const d = new Date(timestampMs);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
