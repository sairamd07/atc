# AIRSPACE CONTROL — Real-Time Aircraft Monitoring Dashboard
https://atc-mauve.vercel.app/
An interactive, production-grade Air Traffic Control (ATC) surveillance dashboard built with **React**, **TypeScript**, **Leaflet**, and **Zustand**, powered by the **OpenSky Network REST API**.

The application delivers real-time situational awareness across regional airspace sectors, tracks individual airframes over time, displays authentic ADS-B telemetry, computes airspace stratification metrics, and provides automated rate-limit mitigation and simulation fallback.

---

## 📸 Screenshots

<img width="1916" height="705" alt="image" src="https://github.com/user-attachments/assets/21a52fc5-6f4c-4563-bd6b-2635550c7356" />


```
+-----------------------------------------------------------------------------------------+
| [RADIO] AIRSPACE CONTROL  ATC-RADAR   [OPENSKY LIVE]  [Southern India]   [AUTO: 12s]    |
+-----------------------------------------------------------------------------------------+
| [Total Tracked: 24]  [Airborne: 21 (↑6 -12 ↓3)]  [On Ground: 3]  [Stale Telemetry: 1]   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|       TACTICAL RADAR DISPLAY (Leaflet Dark Matter / OpenStreetMap)                      |
|       ▲ IGO215 (FL340)       ▲ AIC505 (FL180)                                           |
|            \                                                                            |
|             \--- (Observed Breadcrumb Polyline)                                         |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
| [SELECTED FLIGHT: IGO215]              | [FLIGHT TRACK HISTORY]                         |
| Alt: 34,000 ft (FL340) | Spd: 450 kts  | 14:02:10 - 13.1986° N, 77.7066° E - 34,000 ft  |
| Hdg: 092° (E)          | V/S: Level    | Altitude Profile Recharts Area Chart           |
+-----------------------------------------------------------------------------------------+
| SURVEILLANCE TABLE: Callsign | ICAO24 | Country | Altitude | Speed | Heading | Status   |
+-----------------------------------------------------------------------------------------+
```

---

## 🛠 Technology Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Build**: Vite 8
- **State Management**: Zustand (centralized aircraft store, observation history, sector bounds)
- **Mapping**: Leaflet 1.9 with dynamic rotated SVG transponder markers and polyline breadcrumbs
- **Visualizations**: Recharts (altitude profile and sector flight phase distribution)
- **Icons**: Lucide React
- **Styling**: Tailwind CSS v4 with custom dark radar aesthetics and monospace avionics typography
- **Testing**: Vitest (16 unit tests for vector parsing, coordinates validation, freshness, and store merging)

---

## 🏛 Application Architecture

```
src/
├── components/
│   ├── AircraftDetails.tsx     # Detailed avionics card (altitudes, ground speed, squawk, heading)
│   ├── AircraftFilters.tsx     # Real-time local search and range filtering (no network re-queries)
│   ├── AircraftMap.tsx         # Leaflet radar with heading-rotated markers and history polyline
│   ├── AircraftTable.tsx       # Sortable and searchable target surveillance table
│   ├── AirspaceCharts.tsx      # Recharts visualizations (altitude stratification and flight phase)
│   ├── CustomBoundsModal.tsx   # Custom WGS-84 bounding-box input modal with coordinate validation
│   ├── DashboardHeader.tsx     # Top ATC bar, UTC clock, live status indicator, and mode switcher
│   ├── MovementHistory.tsx     # Session flight trajectory breadcrumbs and altitude area chart
│   ├── StatCard.tsx            # Airspace metric summary cards (airborne, ground, climbing, stale)
│   └── StatusBanner.tsx        # Automated rate-limit backoff countdown and error recovery banner
├── hooks/
│   └── useAircraftPolling.ts   # Timed polling orchestration, AbortController, and backoff handling
├── services/
│   ├── mockData.ts             # Realistic regional simulation telemetry generator (Demo Mode)
│   └── openskyApi.ts           # OpenSky REST API client with CORS proxy and HTTP error handlers
├── store/
│   └── aircraftStore.ts        # Central Zustand store with aircraft lifecycle and deduplication
├── types/
│   └── aircraft.ts             # TypeScript interfaces for states, coordinates, filters, and metrics
├── utils/
│   ├── aircraftParser.ts       # OpenSky 17-element state-vector parser and unit converters
│   ├── freshness.ts            # Stale vs live classification rules (<60s live, 60-180s stale)
│   └── geoBounds.ts            # Regional bounding-box presets and coordinate validators
├── App.tsx                     # Main layout and tab orchestrator
├── main.tsx                    # React application entry point
└── index.css                   # Global styles and Leaflet radar theme overrides
```

---

## 🚀 Setup & Local Execution

### Prerequisites
- Node.js (version 18 or higher)
- npm or bun

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### 3. Run Automated Unit Tests
```bash
npm test
```
Runs the Vitest suite covering vector parsing, coordinate bounds, freshness status, and store merging.

### 4. TypeScript Type Checking & Lint
```bash
npm run lint
```

### 5. Production Build
```bash
npm run build
```
Creates an optimized production bundle inside `dist/`.

---

## 🌐 OpenSky Network API Integration

### Primary Endpoint
```http
GET https://opensky-network.org/api/states/all?lamin={minLat}&lomin={minLon}&lamax={maxLat}&lomax={maxLon}
```

### Positional State Vector Schema (17-element array)
The application strictly parses the OpenSky state-vector array according to the official specification:
- `raw[0]`: `icao24` (Transponder hex identifier, e.g. `"8005bc"`)
- `raw[1]`: `callsign` (Flight number trimmed of padding, e.g. `"IGO215"`)
- `raw[2]`: `origin_country` (Inferred registration country, e.g. `"India"`)
- `raw[3]`: `time_position` (Unix timestamp of last position update)
- `raw[4]`: `last_contact` (Unix timestamp of last radio contact)
- `raw[5]`: `longitude` (WGS-84 longitude decimal degrees)
- `raw[6]`: `latitude` (WGS-84 latitude decimal degrees)
- `raw[7]`: `baro_altitude` (Barometric altitude in meters AMSL)
- `raw[8]`: `on_ground` (Surface indicator boolean)
- `raw[9]`: `velocity` (Ground speed in m/s)
- `raw[10]`: `true_track` (Heading in degrees clockwise from North)
- `raw[11]`: `vertical_rate` (Climb/descent rate in m/s)
- `raw[12]`: `sensors` (Receiver IDs)
- `raw[13]`: `geo_altitude` (Geometric altitude in meters AMSL)
- `raw[14]`: `squawk` (Transponder squawk code, e.g. `"1244"`)
- `raw[15]`: `spi` (Special purpose indicator)
- `raw[16]`: `position_source` (0 = ADS-B, 1 = ASTERIX, 2 = MLAT, 3 = FLARM)
- `raw[17]`: `category` (Aircraft category)

### Authentication & Rate Limits
- **Anonymous Users**: OpenSky allows 1 request per **10 seconds** per IP, and a maximum of **400 requests/day**.
- **Vite Proxy**: Configured in `vite.config.ts` under `/api/opensky` to prevent browser CORS restrictions.
- **Backoff & Rate Limiting**: If an HTTP 429 response is received, the app reads the `Retry-After` header, pauses polling, displays a countdown banner, and preserves the existing snapshot without blanking the map.
- **Simulated Radar Demo Mode**: One-click toggle switch to test the entire dashboard with realistic telemetry vectors when OpenSky servers are rate-limited or unreachable.

---

## 🛡 Stale-Data & Aircraft Lifecycle Policy

1. **Live vs Stale Classification**:
   - `LIVE`: Position timestamp is `< 60 seconds` old.
   - `STALE`: Position timestamp is `>= 60 seconds` and `< 180 seconds` old.
   - `NO POS`: Aircraft lacks valid GPS coordinates.
2. **Missing Aircraft Handling**:
   - Aircraft disappearing from an individual response are kept in snapshot and marked `STALE` for up to 4 consecutive polls.
   - After **5 consecutive misses**, the airframe is retired from the active snapshot, but its **session movement history is safely preserved**.
3. **Out-of-Order Protection**:
   - Snapshots with timestamps older than the current store snapshot are rejected to prevent outdated network packets from overwriting newer telemetry.

For in-depth explanations, see [DATA_HANDLING.md](./DATA_HANDLING.md).

---

## 🚢 Deployment Instructions

### Deploy to Cloud Run / Vercel / Netlify
1. Run `npm run build` to compile static assets into `dist/`.
2. For platforms like Cloud Run or Docker:
   ```dockerfile
   FROM node:20-alpine AS build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

---

## ⚠️ Known Limitations

1. **OpenSky Anonymous Rate Limits**: OpenSky strictly rate limits anonymous IP addresses to 1 request per 10 seconds. For continuous 24/7 monitoring, a registered OpenSky Network account is recommended.
2. **Session Movement History**: Trajectory points are stored in client memory during the active browser session (capped at 60 points per airframe) and do not represent guaranteed origin-to-destination historical flight archives.
