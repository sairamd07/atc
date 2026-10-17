import { AircraftState, FreshnessStatus } from '../types/aircraft';

/**
 * OpenSky REST API State Vector index mapping:
 * 0: icao24 (string)
 * 1: callsign (string | null)
 * 2: origin_country (string)
 * 3: time_position (number | null)
 * 4: last_contact (number)
 * 5: longitude (number | null)
 * 6: latitude (number | null)
 * 7: baro_altitude (number | null)
 * 8: on_ground (boolean)
 * 9: velocity (number | null)
 * 10: true_track (number | null)
 * 11: vertical_rate (number | null)
 * 12: sensors (number[] | null)
 * 13: geo_altitude (number | null)
 * 14: squawk (string | null)
 * 15: spi (boolean)
 * 16: position_source (number)
 * 17: category (number | null)
 */

export function parseStateVector(
  raw: unknown[],
  currentTimeSec: number = Math.floor(Date.now() / 1000)
): AircraftState | null {
  if (!Array.isArray(raw) || raw.length < 17) {
    return null;
  }

  const icao24 = typeof raw[0] === 'string' ? raw[0].trim().toLowerCase() : '';
  if (!icao24) {
    return null;
  }

  const rawCallsign = typeof raw[1] === 'string' ? raw[1].trim() : null;
  const callsign = rawCallsign && rawCallsign.length > 0 ? rawCallsign : null;
  const originCountry = typeof raw[2] === 'string' ? raw[2].trim() : 'Unknown';

  const timePosition = typeof raw[3] === 'number' && !isNaN(raw[3]) ? raw[3] : null;
  const lastContact = typeof raw[4] === 'number' && !isNaN(raw[4]) ? raw[4] : currentTimeSec;

  // Validate coordinates
  let longitude: number | null = null;
  let latitude: number | null = null;

  if (typeof raw[5] === 'number' && !isNaN(raw[5]) && raw[5] >= -180 && raw[5] <= 180) {
    longitude = raw[5];
  }
  if (typeof raw[6] === 'number' && !isNaN(raw[6]) && raw[6] >= -90 && raw[6] <= 90) {
    latitude = raw[6];
  }

  const baroAltitude = typeof raw[7] === 'number' && !isNaN(raw[7]) ? raw[7] : null;
  const onGround = Boolean(raw[8]);
  const velocity = typeof raw[9] === 'number' && !isNaN(raw[9]) && raw[9] >= 0 ? raw[9] : null;
  const trueTrack =
    typeof raw[10] === 'number' && !isNaN(raw[10]) ? (raw[10] >= 0 && raw[10] <= 360 ? raw[10] : (raw[10] % 360 + 360) % 360) : null;
  const verticalRate = typeof raw[11] === 'number' && !isNaN(raw[11]) ? raw[11] : null;

  const sensors = Array.isArray(raw[12]) ? (raw[12] as number[]) : null;
  const geoAltitude = typeof raw[13] === 'number' && !isNaN(raw[13]) ? raw[13] : null;
  const squawk = typeof raw[14] === 'string' && raw[14].trim().length > 0 ? raw[14].trim() : null;
  const spi = Boolean(raw[15]);
  const positionSource = typeof raw[16] === 'number' && !isNaN(raw[16]) ? raw[16] : 0;
  const category = raw.length > 17 && typeof raw[17] === 'number' && !isNaN(raw[17]) ? raw[17] : null;

  // Freshness classification
  let freshness: FreshnessStatus = 'fresh';
  if (latitude === null || longitude === null) {
    freshness = 'missing-position';
  } else {
    const referenceTime = timePosition ?? lastContact;
    const ageSeconds = currentTimeSec - referenceTime;
    if (ageSeconds >= 60) {
      freshness = 'stale';
    }
  }

  const nowMs = Date.now();

  return {
    icao24,
    callsign,
    originCountry,
    timePosition,
    lastContact,
    longitude,
    latitude,
    baroAltitude,
    geoAltitude,
    onGround,
    velocity,
    trueTrack,
    verticalRate,
    sensors,
    squawk,
    spi,
    positionSource,
    category,
    freshness,
    firstSeen: nowMs,
    lastSeen: nowMs,
    consecutiveMisses: 0,
  };
}

// Unit conversions
export const metersToFeet = (m: number | null): number | null => (m !== null ? Math.round(m * 3.28084) : null);
export const feetToMeters = (ft: number | null): number | null => (ft !== null ? Math.round(ft / 3.28084) : null);
export const mpsToKnots = (mps: number | null): number | null => (mps !== null ? Math.round(mps * 1.94384) : null);
export const mpsToKmh = (mps: number | null): number | null => (mps !== null ? Math.round(mps * 3.6) : null);
export const mpsToFpm = (mps: number | null): number | null => (mps !== null ? Math.round(mps * 196.85) : null);

// Display formatters ensuring zero is distinct from N/A
export function formatAltitudeFt(meters: number | null): string {
  if (meters === null || isNaN(meters)) return 'N/A';
  const ft = metersToFeet(meters)!;
  return `${ft.toLocaleString()} ft`;
}

export function formatFlightLevel(meters: number | null): string {
  if (meters === null || isNaN(meters)) return 'N/A';
  const ft = metersToFeet(meters)!;
  if (ft < 10000) return `${ft.toLocaleString()} ft`;
  const fl = Math.round(ft / 100);
  return `FL${fl.toString().padStart(3, '0')}`;
}

export function formatSpeedKts(mps: number | null): string {
  if (mps === null || isNaN(mps)) return 'N/A';
  const kts = mpsToKnots(mps)!;
  return `${kts} kts`;
}

export function formatSpeedKmh(mps: number | null): string {
  if (mps === null || isNaN(mps)) return 'N/A';
  const kmh = mpsToKmh(mps)!;
  return `${kmh} km/h`;
}

export function formatHeading(deg: number | null): string {
  if (deg === null || isNaN(deg)) return 'N/A';
  const rounded = Math.round(deg) % 360;
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(rounded / 22.5) % 16;
  return `${rounded.toString().padStart(3, '0')}° (${dirs[index]})`;
}

export function formatVerticalRate(mps: number | null): string {
  if (mps === null || isNaN(mps)) return 'N/A';
  const fpm = mpsToFpm(mps)!;
  if (Math.abs(fpm) < 100) return 'Level (0 fpm)';
  if (fpm > 0) return `+${fpm.toLocaleString()} fpm ↑`;
  return `${fpm.toLocaleString()} fpm ↓`;
}
