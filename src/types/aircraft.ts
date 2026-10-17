/**
 * Types for Airspace Control — Real-Time Aircraft Monitoring Dashboard
 */

export interface GeoBounds {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
}

export interface RegionPreset {
  id: string;
  name: string;
  description: string;
  bounds: GeoBounds;
  center: [number, number]; // [lat, lng]
  defaultZoom: number;
}

export type FreshnessStatus = 'fresh' | 'stale' | 'missing-position';

export interface AircraftState {
  // Transponder & Identification
  icao24: string;
  callsign: string | null;
  originCountry: string;

  // Timestamps (Unix seconds)
  timePosition: number | null;
  lastContact: number;

  // Spatial coordinates
  longitude: number | null;
  latitude: number | null;

  // Altitude & Velocities
  baroAltitude: number | null; // meters
  geoAltitude: number | null;  // meters
  onGround: boolean;
  velocity: number | null;     // m/s
  trueTrack: number | null;    // degrees (0 = North)
  verticalRate: number | null; // m/s (positive = climb, negative = descent)

  // Radar & Transponder Extras
  sensors: number[] | null;
  squawk: string | null;
  spi: boolean;
  positionSource: number; // 0=ADS-B, 1=ASTERIX, 2=MLAT, 3=FLARM
  category: number | null;

  // Application session tracking & derived state
  freshness: FreshnessStatus;
  firstSeen: number;       // timestamp ms
  lastSeen: number;        // timestamp ms
  consecutiveMisses: number; // count of polls aircraft wasn't in response
}

export interface AircraftHistoryPoint {
  timestamp: number; // epoch ms
  lat: number;
  lng: number;
  altitudeMeters: number | null;
  altitudeFeet: number | null;
  velocityKts: number | null;
  heading: number | null;
  verticalRateFpm: number | null;
}

export type GroundFilter = 'all' | 'airborne' | 'ground';
export type FreshnessFilter = 'all' | 'fresh' | 'stale';
export type SortColumn = 'callsign' | 'altitude' | 'speed' | 'heading' | 'lastContact' | 'icao24' | 'country';
export type SortDirection = 'asc' | 'desc';

export interface AircraftFilters {
  searchQuery: string;
  minAltitudeFt: number;
  maxAltitudeFt: number;
  minSpeedKts: number;
  maxSpeedKts: number;
  groundStatus: GroundFilter;
  freshnessStatus: FreshnessFilter;
  sortBy: SortColumn;
  sortDirection: SortDirection;
}

export interface ApiErrorState {
  message: string;
  status?: number;
  retryAfterSeconds?: number;
  timestamp: number;
  isRateLimit: boolean;
}

export interface AirspaceStats {
  total: number;
  airborne: number;
  ground: number;
  stale: number;
  climbing: number;
  descending: number;
  level: number;
  avgSpeedKts: number;
  maxAltitudeFt: number;
}
