import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseStateVector,
  metersToFeet,
  mpsToKnots,
  mpsToFpm,
} from '../src/utils/aircraftParser';
import { computeFreshness } from '../src/utils/freshness';
import { validateGeoBounds } from '../src/utils/geoBounds';
import { useAircraftStore } from '../src/store/aircraftStore';
import { AircraftState } from '../src/types/aircraft';

describe('OpenSky State Vector Parser', () => {
  const sampleNow = 1718000000;

  it('correctly parses a complete, valid OpenSky state vector', () => {
    const rawVector = [
      '8005bc',       // 0: icao24
      'IGO215  ',     // 1: callsign (with whitespace)
      'India',        // 2: origin_country
      1717999990,     // 3: time_position
      1717999995,     // 4: last_contact
      77.7066,        // 5: longitude
      13.1986,        // 6: latitude
      10668,          // 7: baro_altitude
      false,          // 8: on_ground
      230.5,          // 9: velocity
      92.4,           // 10: true_track
      0.0,            // 11: vertical_rate
      null,           // 12: sensors
      10800,          // 13: geo_altitude
      '1244',         // 14: squawk
      false,          // 15: spi
      0,              // 16: position_source
      1               // 17: category
    ];

    const parsed = parseStateVector(rawVector, sampleNow);
    expect(parsed).not.toBeNull();
    expect(parsed?.icao24).toBe('8005bc');
    expect(parsed?.callsign).toBe('IGO215'); // trimmed
    expect(parsed?.originCountry).toBe('India');
    expect(parsed?.longitude).toBe(77.7066);
    expect(parsed?.latitude).toBe(13.1986);
    expect(parsed?.baroAltitude).toBe(10668);
    expect(parsed?.onGround).toBe(false);
    expect(parsed?.velocity).toBe(230.5);
    expect(parsed?.trueTrack).toBe(92.4);
    expect(parsed?.squawk).toBe('1244');
    expect(parsed?.freshness).toBe('fresh'); // age is 10s (< 60s)
  });

  it('gracefully handles missing and null fields', () => {
    const rawVector = [
      'a02341',
      null,           // callsign is null
      'United States',
      null,           // time_position is null
      1717999990,
      null,           // longitude is null
      null,           // latitude is null
      null,           // baro_altitude is null
      true,           // on_ground
      null,           // velocity is null
      null,           // true_track is null
      null,           // vertical_rate
      null,
      null,
      null,           // squawk is null
      false,
      0
    ];

    const parsed = parseStateVector(rawVector, sampleNow);
    expect(parsed).not.toBeNull();
    expect(parsed?.icao24).toBe('a02341');
    expect(parsed?.callsign).toBeNull();
    expect(parsed?.latitude).toBeNull();
    expect(parsed?.longitude).toBeNull();
    expect(parsed?.freshness).toBe('missing-position');
    expect(parsed?.onGround).toBe(true);
  });

  it('rejects out-of-bounds coordinates', () => {
    const rawVector = [
      '4b1812',
      'SWR123',
      'Switzerland',
      1717999990,
      1717999990,
      250.0,          // Invalid longitude (> 180)
      -120.0,         // Invalid latitude (< -90)
      5000,
      false,
      200,
      180,
      0,
      null,
      5000,
      '1000',
      false,
      0
    ];

    const parsed = parseStateVector(rawVector, sampleNow);
    expect(parsed).not.toBeNull();
    expect(parsed?.longitude).toBeNull();
    expect(parsed?.latitude).toBeNull();
    expect(parsed?.freshness).toBe('missing-position');
  });

  it('returns null for malformed or incomplete arrays', () => {
    expect(parseStateVector([])).toBeNull();
    expect(parseStateVector(['only_one_field'])).toBeNull();
    expect(parseStateVector([null, null])).toBeNull();
  });
});

describe('Freshness Classification', () => {
  const now = 1718000000;

  it('classifies reports under 60 seconds as fresh', () => {
    const plane: AircraftState = {
      icao24: 'test1',
      callsign: 'TEST1',
      originCountry: 'India',
      timePosition: now - 30, // 30s ago
      lastContact: now - 30,
      longitude: 77.0,
      latitude: 13.0,
      baroAltitude: 3000,
      geoAltitude: null,
      onGround: false,
      velocity: 150,
      trueTrack: 90,
      verticalRate: 0,
      sensors: null,
      squawk: '1200',
      spi: false,
      positionSource: 0,
      category: null,
      freshness: 'fresh',
      firstSeen: 0,
      lastSeen: 0,
      consecutiveMisses: 0,
    };

    expect(computeFreshness(plane, now)).toBe('fresh');
  });

  it('classifies reports 60 seconds or older as stale', () => {
    const plane: AircraftState = {
      icao24: 'test2',
      callsign: 'TEST2',
      originCountry: 'India',
      timePosition: now - 95, // 95s ago
      lastContact: now - 95,
      longitude: 77.0,
      latitude: 13.0,
      baroAltitude: 3000,
      geoAltitude: null,
      onGround: false,
      velocity: 150,
      trueTrack: 90,
      verticalRate: 0,
      sensors: null,
      squawk: '1200',
      spi: false,
      positionSource: 0,
      category: null,
      freshness: 'fresh',
      firstSeen: 0,
      lastSeen: 0,
      consecutiveMisses: 0,
    };

    expect(computeFreshness(plane, now)).toBe('stale');
  });

  it('classifies missing coordinates as missing-position', () => {
    const plane: AircraftState = {
      icao24: 'test3',
      callsign: 'TEST3',
      originCountry: 'India',
      timePosition: now - 10,
      lastContact: now - 10,
      longitude: null,
      latitude: null,
      baroAltitude: 3000,
      geoAltitude: null,
      onGround: false,
      velocity: 150,
      trueTrack: 90,
      verticalRate: 0,
      sensors: null,
      squawk: '1200',
      spi: false,
      positionSource: 0,
      category: null,
      freshness: 'fresh',
      firstSeen: 0,
      lastSeen: 0,
      consecutiveMisses: 0,
    };

    expect(computeFreshness(plane, now)).toBe('missing-position');
  });
});

describe('Geographic Bounds Validation', () => {
  it('accepts valid southern India bounding box', () => {
    const bounds = {
      lamin: 8.0,
      lomin: 74.0,
      lamax: 15.5,
      lomax: 81.5,
    };
    const res = validateGeoBounds(bounds);
    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('rejects inverted latitudes (lamin >= lamax)', () => {
    const bounds = {
      lamin: 25.0,
      lomin: 74.0,
      lamax: 15.0,
      lomax: 81.5,
    };
    const res = validateGeoBounds(bounds);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Min Latitude must be strictly less than Max Latitude');
  });

  it('rejects out of range latitudes (> 90)', () => {
    const bounds = {
      lamin: 10.0,
      lomin: 74.0,
      lamax: 95.0,
      lomax: 81.5,
    };
    const res = validateGeoBounds(bounds);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Latitude must be between -90° and +90°');
  });
});

describe('Unit Conversion Functions', () => {
  it('converts meters to feet accurately', () => {
    expect(metersToFeet(10000)).toBe(32808);
    expect(metersToFeet(0)).toBe(0);
    expect(metersToFeet(null)).toBeNull();
  });

  it('converts m/s to knots accurately', () => {
    expect(mpsToKnots(100)).toBe(194);
    expect(mpsToKnots(0)).toBe(0);
    expect(mpsToKnots(null)).toBeNull();
  });

  it('converts m/s vertical rate to fpm accurately', () => {
    expect(mpsToFpm(5.0)).toBe(984);
    expect(mpsToFpm(-3.5)).toBe(-689);
    expect(mpsToFpm(null)).toBeNull();
  });
});

describe('Zustand Aircraft Store & Snapshot Merging', () => {
  beforeEach(() => {
    useAircraftStore.setState({
      aircraftMap: {},
      historyMap: {},
      selectedIcao: null,
      lastSuccessfulSnapshotTime: null,
    });
  });

  it('merges incoming snapshot and preserves ICAO24 stable identification', () => {
    const store = useAircraftStore.getState();

    const plane1: AircraftState = {
      icao24: '8005bc',
      callsign: 'IGO215',
      originCountry: 'India',
      timePosition: 1718000000,
      lastContact: 1718000000,
      longitude: 77.5,
      latitude: 13.0,
      baroAltitude: 5000,
      geoAltitude: null,
      onGround: false,
      velocity: 180,
      trueTrack: 90,
      verticalRate: 2.0,
      sensors: null,
      squawk: '1244',
      spi: false,
      positionSource: 0,
      category: null,
      freshness: 'fresh',
      firstSeen: 1000,
      lastSeen: 1000,
      consecutiveMisses: 0,
    };

    store.processApiSnapshot([plane1], 1718000000, 100);

    const updated = useAircraftStore.getState().aircraftMap['8005bc'];
    expect(updated).toBeDefined();
    expect(updated.callsign).toBe('IGO215');
    expect(updated.consecutiveMisses).toBe(0);

    // Now send subsequent update with new coordinates
    const plane1Updated: AircraftState = {
      ...plane1,
      latitude: 13.1,
      longitude: 77.6,
      baroAltitude: 6000,
    };

    store.processApiSnapshot([plane1Updated], 1718000012, 100);

    const history = useAircraftStore.getState().historyMap['8005bc'];
    expect(history).toBeDefined();
    expect(history.length).toBe(2);
  });

  it('deduplicates movement history when aircraft has not moved meaningfully', () => {
    const store = useAircraftStore.getState();

    const parkedPlane: AircraftState = {
      icao24: '800ab2',
      callsign: 'AIC505',
      originCountry: 'India',
      timePosition: 1718000000,
      lastContact: 1718000000,
      longitude: 80.1709,
      latitude: 12.9941,
      baroAltitude: 0,
      geoAltitude: null,
      onGround: true,
      velocity: 0,
      trueTrack: 0,
      verticalRate: 0,
      sensors: null,
      squawk: '1000',
      spi: false,
      positionSource: 0,
      category: null,
      freshness: 'fresh',
      firstSeen: 1000,
      lastSeen: 1000,
      consecutiveMisses: 0,
    };

    // Feed same position multiple times
    store.processApiSnapshot([parkedPlane], 1718000000, 50);
    store.processApiSnapshot([parkedPlane], 1718000010, 50);
    store.processApiSnapshot([parkedPlane], 1718000020, 50);

    // History should not record duplicate identical static points
    const history = useAircraftStore.getState().historyMap['800ab2'];
    expect(history.length).toBe(1);
  });

  it('retires departed aircraft after 5 consecutive misses while retaining their history', () => {
    const store = useAircraftStore.getState();

    const departingPlane: AircraftState = {
      icao24: 'depart1',
      callsign: 'DEP001',
      originCountry: 'India',
      timePosition: 1718000000,
      lastContact: 1718000000,
      longitude: 77.0,
      latitude: 13.0,
      baroAltitude: 3000,
      geoAltitude: null,
      onGround: false,
      velocity: 200,
      trueTrack: 90,
      verticalRate: 0,
      sensors: null,
      squawk: '2000',
      spi: false,
      positionSource: 0,
      category: null,
      freshness: 'fresh',
      firstSeen: 1000,
      lastSeen: 1000,
      consecutiveMisses: 0,
    };

    // Initial appearance
    store.processApiSnapshot([departingPlane], 1718000000, 50);
    expect(useAircraftStore.getState().aircraftMap['depart1']).toBeDefined();

    // 4 empty responses: plane is marked stale but kept in snapshot
    for (let i = 1; i <= 4; i++) {
      store.processApiSnapshot([], 1718000000 + i * 10, 50);
      expect(useAircraftStore.getState().aircraftMap['depart1']).toBeDefined();
      expect(useAircraftStore.getState().aircraftMap['depart1'].freshness).toBe('stale');
    }

    // 5th missing response: retired from active snapshot
    store.processApiSnapshot([], 1718000000 + 50, 50);
    expect(useAircraftStore.getState().aircraftMap['depart1']).toBeUndefined();

    // BUT history is preserved!
    expect(useAircraftStore.getState().historyMap['depart1']).toBeDefined();
    expect(useAircraftStore.getState().historyMap['depart1'].length).toBeGreaterThanOrEqual(1);
  });
});
