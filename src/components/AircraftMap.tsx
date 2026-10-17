import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { useAircraftStore } from '../store/aircraftStore';
import { AircraftState } from '../types/aircraft';
import { formatFlightLevel, metersToFeet, mpsToKnots } from '../utils/aircraftParser';

// Tile provider options with guaranteed available endpoints
const TILE_PROVIDERS = {
  cartoDark: {
    id: 'cartoDark',
    name: 'Carto Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
  },
  esriDark: {
    id: 'esriDark',
    name: 'Esri Dark Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    subdomains: [],
    attribution: '&copy; Esri',
    maxZoom: 16,
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: [],
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  },
};

type TileStyleKey = keyof typeof TILE_PROVIDERS;

function getAircraftColor(plane: AircraftState): { fill: string; stroke: string } {
  if (plane.squawk === '7700' || plane.squawk === '7600' || plane.squawk === '7500') {
    return { fill: '#d94e33', stroke: '#1a1a1a' };
  }

  if (plane.onGround) {
    return { fill: '#71717a', stroke: '#1a1a1a' };
  }

  if (plane.freshness === 'stale') {
    return { fill: '#f59e0b', stroke: '#1a1a1a' };
  }

  const altFt = plane.baroAltitude ? metersToFeet(plane.baroAltitude)! : 0;

  if (altFt < 10000) {
    return { fill: '#10b981', stroke: '#1a1a1a' };
  } else if (altFt < 30000) {
    return { fill: '#06b6d4', stroke: '#1a1a1a' };
  } else {
    return { fill: '#6366f1', stroke: '#1a1a1a' };
  }
}

function createAircraftIcon(plane: AircraftState, isSelected: boolean): L.DivIcon {
  const heading = plane.trueTrack !== null ? Math.round(plane.trueTrack) : 0;
  const { fill, stroke } = getAircraftColor(plane);
  const size = isSelected ? 34 : 26;
  const callsign = plane.callsign || plane.icao24.toUpperCase();
  const fl = formatFlightLevel(plane.baroAltitude);

  const html = `
    <div class="relative flex items-center justify-center select-none aircraft-marker-container" style="width: ${size}px; height: ${size}px;">
      ${
        isSelected
          ? `<div class="absolute -inset-2 border-2 border-[#d94e33] border-dashed animate-spin opacity-80" style="animation-duration: 8s;"></div>`
          : ''
      }
      <div style="transform: rotate(${heading}deg); transition: transform 0.3s ease;">
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
          <path d="M12 2 L13.5 9 L21 12.5 L21 14.5 L13.5 13 L13.5 19 L16 21 L16 22 L12 21.2 L8 22 L8 21 L10.5 19 L10.5 13 L3 14.5 L3 12.5 L10.5 9 Z" />
        </svg>
      </div>
      <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 text-[9px] font-mono-tech whitespace-nowrap bg-[#1a1a1a] text-[#f2efeb] border border-[#1a1a1a] shadow-md pointer-events-none ${
        isSelected ? 'border-[#d94e33] text-[#d94e33] font-bold' : ''
      }">
        ${callsign} ${plane.onGround ? '(GND)' : fl}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-aircraft-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface AircraftMapProps {
  onToggleAnalytics?: () => void;
  showAnalytics?: boolean;
}

export const AircraftMap: React.FC<AircraftMapProps> = ({
  onToggleAnalytics,
  showAnalytics = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapStyle, setMapStyle] = useState<TileStyleKey>('cartoDark');

  const {
    aircraftMap,
    historyMap,
    selectedIcao,
    setSelectedIcao,
    activeBounds,
    selectedRegion,
    filters,
  } = useAircraftStore();

  const validAircraft = useMemo(() => {
    return Object.values(aircraftMap).filter((plane) => {
      if (plane.latitude === null || plane.longitude === null) return false;

      if (filters.groundStatus === 'airborne' && plane.onGround) return false;
      if (filters.groundStatus === 'ground' && !plane.onGround) return false;

      if (filters.freshnessStatus === 'fresh' && plane.freshness !== 'fresh') return false;
      if (filters.freshnessStatus === 'stale' && plane.freshness !== 'stale') return false;

      if (plane.baroAltitude !== null) {
        const ft = metersToFeet(plane.baroAltitude)!;
        if (ft < filters.minAltitudeFt || ft > filters.maxAltitudeFt) return false;
      }

      if (plane.velocity !== null) {
        const kts = mpsToKnots(plane.velocity)!;
        if (kts < filters.minSpeedKts || kts > filters.maxSpeedKts) return false;
      }

      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.trim().toLowerCase();
        const callsignMatch = plane.callsign && plane.callsign.toLowerCase().includes(q);
        const icaoMatch = plane.icao24.toLowerCase().includes(q);
        const countryMatch = plane.originCountry.toLowerCase().includes(q);
        if (!callsignMatch && !icaoMatch && !countryMatch) return false;
      }

      return true;
    });
  }, [aircraftMap, filters]);

  const attachTileLayer = (map: L.Map, styleKey: TileStyleKey) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const provider = TILE_PROVIDERS[styleKey] || TILE_PROVIDERS.cartoDark;

    const layer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains,
      crossOrigin: true,
    });

    layer.on('tileerror', () => {
      if (styleKey === 'cartoDark') {
        setMapStyle('esriDark');
      } else if (styleKey === 'esriDark') {
        setMapStyle('osm');
      }
    });

    layer.addTo(map);
    tileLayerRef.current = layer;
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter = selectedRegion.center;
    const initialZoom = selectedRegion.defaultZoom;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    });

    attachTileLayer(map, mapStyle);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    attachTileLayer(mapRef.current, mapStyle);
  }, [mapStyle]);

  useEffect(() => {
    if (!mapRef.current) return;

    const bounds = L.latLngBounds(
      [activeBounds.lamin, activeBounds.lomin],
      [activeBounds.lamax, activeBounds.lomax]
    );

    mapRef.current.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 10,
      animate: true,
      duration: 0.8,
    });

    mapRef.current.invalidateSize();
  }, [activeBounds]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const currentMarkerMap = markersRef.current;
    const currentIcaos = new Set<string>();

    for (const plane of validAircraft) {
      currentIcaos.add(plane.icao24);
      const isSelected = plane.icao24 === selectedIcao;
      const lat = plane.latitude!;
      const lng = plane.longitude!;

      const existingMarker = currentMarkerMap.get(plane.icao24);

      if (existingMarker) {
        existingMarker.setLatLng([lat, lng]);
        existingMarker.setIcon(createAircraftIcon(plane, isSelected));
        if (isSelected) {
          existingMarker.setZIndexOffset(1000);
        } else {
          existingMarker.setZIndexOffset(0);
        }
      } else {
        const marker = L.marker([lat, lng], {
          icon: createAircraftIcon(plane, isSelected),
          zIndexOffset: isSelected ? 1000 : 0,
        });

        marker.on('click', () => {
          setSelectedIcao(plane.icao24);
        });

        marker.addTo(map);
        currentMarkerMap.set(plane.icao24, marker);
      }
    }

    for (const [icao, marker] of currentMarkerMap.entries()) {
      if (!currentIcaos.has(icao)) {
        map.removeLayer(marker);
        currentMarkerMap.delete(icao);
      }
    }
  }, [validAircraft, selectedIcao, setSelectedIcao]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (!selectedIcao) return;

    const historyPoints = historyMap[selectedIcao] || [];
    if (historyPoints.length < 2) return;

    const latLngs: [number, number][] = historyPoints.map((pt) => [pt.lat, pt.lng]);

    const line = L.polyline(latLngs, {
      color: '#d94e33', // Vermilion accent
      weight: 3,
      opacity: 0.95,
      dashArray: '6, 6',
      lineCap: 'square',
    });

    line.addTo(map);
    polylineRef.current = line;
  }, [selectedIcao, historyMap]);

  const handleFitRegion = () => {
    if (!mapRef.current) return;
    const bounds = L.latLngBounds(
      [activeBounds.lamin, activeBounds.lomin],
      [activeBounds.lamax, activeBounds.lomax]
    );
    mapRef.current.fitBounds(bounds, { padding: [30, 30], animate: true });
    mapRef.current.invalidateSize();
  };

  const handleRecenterSelected = () => {
    if (!mapRef.current || !selectedIcao) return;
    const selected = aircraftMap[selectedIcao];
    if (selected && selected.latitude !== null && selected.longitude !== null) {
      mapRef.current.setView([selected.latitude, selected.longitude], 10, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] radar-grid-bg">
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-0" />

      {/* Variation 3 Brutalist Map Overlay Box */}
      <div className="absolute top-4 left-4 z-20 bg-[#f2efeb] border-2 border-[#1a1a1a] p-3 shadow-md select-none max-w-xs">
        <div className="label-tech text-[#1a1a1a]">Radar Legend</div>
        <div className="flex flex-col gap-1 mt-2 text-xs font-mono-tech font-bold">
          <div>
            <span className="text-[#10b981]">■</span> LOW &lt;10K
          </div>
          <div>
            <span className="text-[#06b6d4]">■</span> MID 10-30K
          </div>
          <div>
            <span className="text-[#6366f1]">■</span> HIGH &gt;30K
          </div>
          <div>
            <span className="text-[#71717a]">■</span> SURFACE / TAXI
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-3 pt-2 border-t border-[#1a1a1a]/20">
          <button
            onClick={handleFitRegion}
            className="border-2 border-[#1a1a1a] bg-transparent hover:bg-[#1a1a1a] hover:text-[#f2efeb] px-2.5 py-1 text-xs font-mono-tech font-bold uppercase transition-all"
          >
            Fit Sector
          </button>

          {selectedIcao && (
            <button
              onClick={handleRecenterSelected}
              className="border-2 border-[#d94e33] bg-[#d94e33] text-white hover:bg-[#1a1a1a] hover:border-[#1a1a1a] px-2.5 py-1 text-xs font-mono-tech font-bold uppercase transition-all"
            >
              Lock Target
            </button>
          )}

          {onToggleAnalytics && (
            <button
              onClick={onToggleAnalytics}
              className={`border-2 border-[#1a1a1a] px-2.5 py-1 text-xs font-mono-tech font-bold uppercase transition-all ${
                showAnalytics ? 'bg-[#1a1a1a] text-[#f2efeb]' : 'bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f2efeb]'
              }`}
            >
              {showAnalytics ? 'Tactical Map' : 'Sector Analytics'}
            </button>
          )}

          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] font-mono-tech font-bold text-[#1a1a1a]/60">MAP:</span>
            <select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value as TileStyleKey)}
              className="bg-transparent text-[10px] font-mono-tech font-bold border-b border-[#1a1a1a] focus:outline-none"
            >
              <option value="cartoDark">Carto Dark</option>
              <option value="esriDark">Esri Dark</option>
              <option value="osm">OpenStreetMap</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
