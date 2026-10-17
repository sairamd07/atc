import { GeoBounds, RegionPreset } from '../types/aircraft';

export const REGION_PRESETS: RegionPreset[] = [
  {
    id: 'southern-india',
    name: 'Southern India',
    description: 'Bengaluru (BLR), Chennai (MAA), Kochi (COK), Hyderabad (HYD)',
    bounds: {
      lamin: 8.0,
      lomin: 74.0,
      lamax: 15.5,
      lomax: 81.5,
    },
    center: [12.5, 77.8],
    defaultZoom: 7,
  },
  {
    id: 'india-entire',
    name: 'India (National Airspace)',
    description: 'All Flight Information Regions (FIRs) across India',
    bounds: {
      lamin: 7.5,
      lomin: 68.0,
      lamax: 32.5,
      lomax: 93.0,
    },
    center: [20.5, 78.9],
    defaultZoom: 5,
  },
  {
    id: 'europe-central',
    name: 'Western & Central Europe',
    description: 'London (LHR), Paris (CDG), Frankfurt (FRA), Zurich (ZRH)',
    bounds: {
      lamin: 43.5,
      lomin: -4.0,
      lamax: 54.0,
      lomax: 14.5,
    },
    center: [49.5, 5.0],
    defaultZoom: 6,
  },
  {
    id: 'north-america-east',
    name: 'North America (East Coast)',
    description: 'New York (JFK), Boston (BOS), Atlanta (ATL), Miami (MIA)',
    bounds: {
      lamin: 25.5,
      lomin: -84.0,
      lamax: 43.0,
      lomax: -70.0,
    },
    center: [34.5, -77.0],
    defaultZoom: 6,
  },
  {
    id: 'middle-east-gulf',
    name: 'Middle East (Gulf Hubs)',
    description: 'Dubai (DXB), Doha (DOH), Abu Dhabi (AUH)',
    bounds: {
      lamin: 22.0,
      lomin: 50.0,
      lamax: 27.5,
      lomax: 57.0,
    },
    center: [24.8, 54.5],
    defaultZoom: 7,
  },
  {
    id: 'singapore-se-asia',
    name: 'Singapore & Malacca Strait',
    description: 'Singapore Changi (SIN), Kuala Lumpur (KUL)',
    bounds: {
      lamin: 1.0,
      lomin: 101.5,
      lamax: 6.0,
      lomax: 106.0,
    },
    center: [2.8, 103.8],
    defaultZoom: 8,
  },
];

export const DEFAULT_REGION = REGION_PRESETS[0]; // Southern India

export interface BoundsValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateGeoBounds(bounds: Partial<GeoBounds>): BoundsValidationResult {
  if (
    bounds.lamin === undefined ||
    bounds.lomin === undefined ||
    bounds.lamax === undefined ||
    bounds.lomax === undefined
  ) {
    return { isValid: false, error: 'All 4 bounding box coordinates are required' };
  }

  if (isNaN(bounds.lamin) || isNaN(bounds.lamax) || isNaN(bounds.lomin) || isNaN(bounds.lomax)) {
    return { isValid: false, error: 'Coordinates must be valid numbers' };
  }

  if (bounds.lamin < -90 || bounds.lamin > 90 || bounds.lamax < -90 || bounds.lamax > 90) {
    return { isValid: false, error: 'Latitude must be between -90° and +90°' };
  }

  if (bounds.lomin < -180 || bounds.lomin > 180 || bounds.lomax < -180 || bounds.lomax > 180) {
    return { isValid: false, error: 'Longitude must be between -180° and +180°' };
  }

  if (bounds.lamin >= bounds.lamax) {
    return { isValid: false, error: 'Min Latitude must be strictly less than Max Latitude' };
  }

  if (bounds.lomin >= bounds.lomax) {
    return { isValid: false, error: 'Min Longitude must be strictly less than Max Longitude' };
  }

  const latSpan = bounds.lamax - bounds.lamin;
  const lonSpan = bounds.lomax - bounds.lomin;

  if (latSpan > 45 || lonSpan > 45) {
    return {
      isValid: false,
      error: 'Bounding box is too large for OpenSky free tier (max ~45° span recommended)',
    };
  }

  return { isValid: true };
}

export function formatCoordinates(lat: number | null, lon: number | null): string {
  if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return 'N/A';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}
