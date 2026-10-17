import { AircraftState, GeoBounds } from '../types/aircraft';

interface BaseFlight {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lng: number;
  altitudeMeters: number;
  velocityMps: number;
  heading: number;
  verticalRateMps: number;
  onGround: boolean;
  squawk: string;
}

const REGIONAL_BASE_FLIGHTS: Record<string, BaseFlight[]> = {
  'southern-india': [
    { icao24: '8005bc', callsign: 'IGO215', originCountry: 'India', lat: 13.1986, lng: 77.7066, altitudeMeters: 450, velocityMps: 75, heading: 92, verticalRateMps: 8.5, onGround: false, squawk: '1244' }, // Departing BLR
    { icao24: '800ab2', callsign: 'AIC505', originCountry: 'India', lat: 12.9941, lng: 80.1709, altitudeMeters: 0, velocityMps: 12, heading: 250, verticalRateMps: 0, onGround: true, squawk: '1000' }, // Taxiing MAA
    { icao24: '800cd4', callsign: 'SEJ8132', originCountry: 'India', lat: 10.1518, lng: 76.3929, altitudeMeters: 8500, velocityMps: 215, heading: 45, verticalRateMps: 4.2, onGround: false, squawk: '2105' }, // Climbing COK
    { icao24: '8012ef', callsign: 'AKJ1304', originCountry: 'India', lat: 14.8500, lng: 78.4500, altitudeMeters: 10668, velocityMps: 232, heading: 185, verticalRateMps: 0, onGround: false, squawk: '3312' }, // En route FL350
    { icao24: '8940fe', callsign: 'UAE567', originCountry: 'United Arab Emirates', lat: 11.8500, lng: 75.3200, altitudeMeters: 11582, velocityMps: 250, heading: 305, verticalRateMps: 0, onGround: false, squawk: '4521' }, // Dubai bound FL380
    { icao24: '760921', callsign: 'SIA503', originCountry: 'Singapore', lat: 12.4500, lng: 79.1200, altitudeMeters: 11277, velocityMps: 245, heading: 110, verticalRateMps: 0, onGround: false, squawk: '7102' }, // Changi bound FL370
    { icao24: '8011aa', callsign: 'VTI942', originCountry: 'India', lat: 13.8200, lng: 76.6000, altitudeMeters: 9448, velocityMps: 228, heading: 350, verticalRateMps: 0, onGround: false, squawk: '2044' }, // Delhi bound FL310
    { icao24: '70014a', callsign: 'ALK102', originCountry: 'Sri Lanka', lat: 9.5400, lng: 78.9500, altitudeMeters: 6705, velocityMps: 198, heading: 195, verticalRateMps: -5.5, onGround: false, squawk: '1540' }, // Descending Colombo
    { icao24: '800fe1', callsign: 'IGO6301', originCountry: 'India', lat: 13.0800, lng: 77.5800, altitudeMeters: 2800, velocityMps: 140, heading: 90, verticalRateMps: -3.8, onGround: false, squawk: '0621' }, // Approach BLR
    { icao24: '80145b', callsign: 'AIC808', originCountry: 'India', lat: 15.1200, lng: 76.9200, altitudeMeters: 10363, velocityMps: 238, heading: 165, verticalRateMps: 0, onGround: false, squawk: '3114' }, // Hyderabad to Bangalore FL340
    { icao24: '80099c', callsign: 'SEJ331', originCountry: 'India', lat: 11.0168, lng: 76.9558, altitudeMeters: 380, velocityMps: 68, heading: 230, verticalRateMps: 6.8, onGround: false, squawk: '1120' }, // Departing CJB
    { icao24: '8019a0', callsign: 'IGO882', originCountry: 'India', lat: 14.1500, lng: 79.8000, altitudeMeters: 11887, velocityMps: 248, heading: 20, verticalRateMps: 0, onGround: false, squawk: '2561' }, // Northbound FL390
    { icao24: '06a12b', callsign: 'QTR572', originCountry: 'Qatar', lat: 10.9500, lng: 75.8000, altitudeMeters: 10972, velocityMps: 242, heading: 312, verticalRateMps: 0, onGround: false, squawk: '5210' }, // Doha bound FL360
    { icao24: '800bb3', callsign: 'QP1402', originCountry: 'India', lat: 8.4821, lng: 76.9200, altitudeMeters: 0, velocityMps: 0, heading: 140, verticalRateMps: 0, onGround: true, squawk: '1000' }, // Parked TRV
  ],
  'india-entire': [
    { icao24: '8005bc', callsign: 'IGO215', originCountry: 'India', lat: 13.1986, lng: 77.7066, altitudeMeters: 450, velocityMps: 75, heading: 92, verticalRateMps: 8.5, onGround: false, squawk: '1244' },
    { icao24: '800cd4', callsign: 'AIC101', originCountry: 'India', lat: 19.0896, lng: 72.8656, altitudeMeters: 1500, velocityMps: 110, heading: 270, verticalRateMps: 7.2, onGround: false, squawk: '2301' }, // BOM departure
    { icao24: '80155a', callsign: 'IGO5010', originCountry: 'India', lat: 28.5562, lng: 77.1000, altitudeMeters: 0, velocityMps: 15, heading: 100, verticalRateMps: 0, onGround: true, squawk: '1000' }, // DEL taxi
    { icao24: '8012ef', callsign: 'AKJ1304', originCountry: 'India', lat: 22.5726, lng: 88.3639, altitudeMeters: 9144, velocityMps: 230, heading: 240, verticalRateMps: 0, onGround: false, squawk: '3312' }, // CCU transit
    { icao24: '8940fe', callsign: 'UAE500', originCountry: 'United Arab Emirates', lat: 21.1500, lng: 69.5000, altitudeMeters: 11582, velocityMps: 255, heading: 285, verticalRateMps: 0, onGround: false, squawk: '4521' },
    { icao24: '8011aa', callsign: 'VTI942', originCountry: 'India', lat: 25.8000, lng: 78.5000, altitudeMeters: 10668, velocityMps: 240, heading: 10, verticalRateMps: 0, onGround: false, squawk: '2044' },
    { icao24: '800ab2', callsign: 'AIC505', originCountry: 'India', lat: 12.9941, lng: 80.1709, altitudeMeters: 3200, velocityMps: 150, heading: 70, verticalRateMps: -4.0, onGround: false, squawk: '1000' },
  ],
  'europe-central': [
    { icao24: '4009a8', callsign: 'BAW412', originCountry: 'United Kingdom', lat: 51.4700, lng: -0.4543, altitudeMeters: 1800, velocityMps: 125, heading: 265, verticalRateMps: 6.5, onGround: false, squawk: '7021' }, // LHR departure
    { icao24: '3c65c2', callsign: 'DLH240', originCountry: 'Germany', lat: 50.0379, lng: 8.5622, altitudeMeters: 0, velocityMps: 14, heading: 180, verticalRateMps: 0, onGround: true, squawk: '1000' }, // FRA ground
    { icao24: '3922e3', callsign: 'AFR158', originCountry: 'France', lat: 49.0097, lng: 2.5479, altitudeMeters: 3400, velocityMps: 155, heading: 85, verticalRateMps: -5.0, onGround: false, squawk: '4410' }, // CDG approach
    { icao24: '4b1812', callsign: 'SWR123', originCountry: 'Switzerland', lat: 47.4582, lng: 8.5555, altitudeMeters: 10668, velocityMps: 242, heading: 140, verticalRateMps: 0, onGround: false, squawk: '1200' }, // Zurich en route
    { icao24: '484b91', callsign: 'KLM1001', originCountry: 'Netherlands', lat: 52.3105, lng: 4.7683, altitudeMeters: 450, velocityMps: 78, heading: 360, verticalRateMps: 7.5, onGround: false, squawk: '3601' }, // AMS takeoff
    { icao24: '406a4b', callsign: 'EZY821', originCountry: 'United Kingdom', lat: 48.8566, lng: 5.1200, altitudeMeters: 11277, velocityMps: 248, heading: 160, verticalRateMps: 0, onGround: false, squawk: '2145' },
    { icao24: '3443a5', callsign: 'IBE310', originCountry: 'Spain', lat: 45.2000, lng: 2.1000, altitudeMeters: 10058, velocityMps: 236, heading: 210, verticalRateMps: 0, onGround: false, squawk: '5512' },
  ],
  'north-america-east': [
    { icao24: 'a02341', callsign: 'AAL100', originCountry: 'United States', lat: 40.6413, lng: -73.7781, altitudeMeters: 900, velocityMps: 105, heading: 130, verticalRateMps: 8.0, onGround: false, squawk: '4301' }, // JFK departure
    { icao24: 'a1b442', callsign: 'DAL492', originCountry: 'United States', lat: 33.6407, lng: -84.4277, altitudeMeters: 0, velocityMps: 18, heading: 90, verticalRateMps: 0, onGround: true, squawk: '1000' }, // ATL ground
    { icao24: 'a3811f', callsign: 'UAL821', originCountry: 'United States', lat: 38.9531, lng: -77.4565, altitudeMeters: 8500, velocityMps: 220, heading: 250, verticalRateMps: 4.0, onGround: false, squawk: '2115' }, // IAD climb
    { icao24: 'a45cc9', callsign: 'JBU512', originCountry: 'United States', lat: 35.8000, lng: -78.6000, altitudeMeters: 10668, velocityMps: 240, heading: 180, verticalRateMps: 0, onGround: false, squawk: '3412' }, // En route FL350
    { icao24: 'a98f10', callsign: 'SWA140', originCountry: 'United States', lat: 28.4294, lng: -81.3090, altitudeMeters: 2800, velocityMps: 145, heading: 340, verticalRateMps: -4.5, onGround: false, squawk: '1622' }, // MCO arrival
  ]
};

// Internal mutable simulated state for smooth live-like tick updates
const simulatedFlightsState: Map<string, BaseFlight> = new Map();

export function getSimulatedAircraft(
  regionId: string,
  bounds: GeoBounds,
  stepSeconds: number = 10
): AircraftState[] {
  const baseList = REGIONAL_BASE_FLIGHTS[regionId] || REGIONAL_BASE_FLIGHTS['southern-india'];
  const nowSec = Math.floor(Date.now() / 1000);
  const nowMs = Date.now();

  const results: AircraftState[] = [];

  for (const flight of baseList) {
    let current = simulatedFlightsState.get(flight.icao24);
    if (!current) {
      current = { ...flight };
      simulatedFlightsState.set(flight.icao24, current);
    }

    // Advance position if airborne
    if (!current.onGround && current.velocityMps > 0) {
      const distanceMeters = current.velocityMps * stepSeconds;
      const headingRad = (current.heading * Math.PI) / 180;
      // Approx 111,320 meters per degree lat
      const deltaLat = (distanceMeters * Math.cos(headingRad)) / 111320;
      const deltaLng =
        (distanceMeters * Math.sin(headingRad)) / (111320 * Math.cos((current.lat * Math.PI) / 180));

      current.lat += deltaLat;
      current.lng += deltaLng;

      // Update altitude with vertical rate
      if (current.verticalRateMps !== 0) {
        current.altitudeMeters += current.verticalRateMps * stepSeconds;
        if (current.altitudeMeters > 12500) {
          current.verticalRateMps = 0; // Level off at cruise
        } else if (current.altitudeMeters < 500 && current.verticalRateMps < 0) {
          current.altitudeMeters = 0;
          current.onGround = true;
          current.velocityMps = 15;
          current.verticalRateMps = 0;
        }
      }

      // If flight wanders outside bounding box, wrap it back with realistic inbound heading
      if (current.lat < bounds.lamin || current.lat > bounds.lamax) {
        current.heading = (current.heading + 180) % 360;
        current.lat = Math.max(bounds.lamin + 0.5, Math.min(bounds.lamax - 0.5, current.lat));
      }
      if (current.lng < bounds.lomin || current.lng > bounds.lomax) {
        current.heading = (current.heading + 180) % 360;
        current.lng = Math.max(bounds.lomin + 0.5, Math.min(bounds.lomax - 0.5, current.lng));
      }
    }

    results.push({
      icao24: current.icao24,
      callsign: current.callsign,
      originCountry: current.originCountry,
      timePosition: nowSec,
      lastContact: nowSec,
      longitude: current.lng,
      latitude: current.lat,
      baroAltitude: current.altitudeMeters,
      geoAltitude: current.altitudeMeters > 0 ? current.altitudeMeters + 45 : null,
      onGround: current.onGround,
      velocity: current.velocityMps,
      trueTrack: current.heading,
      verticalRate: current.verticalRateMps,
      sensors: null,
      squawk: current.squawk,
      spi: false,
      positionSource: 0,
      category: 1, // Large aircraft
      freshness: 'fresh',
      firstSeen: nowMs - 600000,
      lastSeen: nowMs,
      consecutiveMisses: 0,
    });
  }

  return results;
}
