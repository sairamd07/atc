# DATA_HANDLING.md — Airspace Control Telemetry Specification

This document provides a comprehensive technical breakdown of how the Airspace Control dashboard manages asynchronous network anomalies, OpenSky rate limits, missing transponder fields, telemetry freshness classification, snapshot versioning, and session track retention.

---

## 1. Network & API Failure Resilience

### 1.1 Snapshot Preservation on Request Failure
When a scheduled poll fails (e.g., HTTP 429, 502 Bad Gateway, network disconnection, or timeout):
- The existing aircraft snapshot in the Zustand store (`aircraftMap`) is **never purged or blanked**.
- The tactical radar map continues displaying the last validated positions.
- A non-destructive top status banner alerts the operator with the specific failure cause and automatic retry countdown.
- The UI displays the timestamp and age of the last successful snapshot (e.g. *"Showing cached snapshot of 24 aircraft from 14:02:15 UTC"*).

### 1.2 Rate Limiting (HTTP 429) & Backoff
- OpenSky limits unauthenticated anonymous queries to 1 request per 10 seconds and 400 requests per day per IP.
- When an HTTP 429 response is received:
  1. The API client parses the `Retry-After` or `X-Rate-Limit-Retry-After-Seconds` header. If absent, a conservative 30-second backoff is applied.
  2. The polling scheduler immediately pauses all outgoing network requests.
  3. A countdown ticker decrements each second in the UI, informing the user of the exact delay before the next permissible query.
  4. Manual refresh buttons are disabled with countdown tooltips to prevent aggravating the rate limit.
  5. The banner offers an instant one-click fallback to **Demo Simulation Mode**, allowing seamless demonstration without waiting.

### 1.3 Out-of-Order Response Prevention
Network packets can arrive out of chronological order (e.g., a delayed response arriving after a quick subsequent query).
- The store tracks `lastSuccessfulSnapshotTime` based on the OpenSky server Unix epoch timestamp (`time`).
- If an incoming response contains a `serverTime < lastSuccessfulSnapshotTime`, it is discarded as obsolete, preventing backwards temporal jumps.

### 1.4 In-Flight Request Cancellation
- When the user selects a different regional sector or changes bounding-box coordinates, an `AbortController` immediately aborts the active pending fetch request.
- This prevents obsolete geographic data from polluting the newly selected airspace sector.

---

## 2. Telemetry Parsing & Missing Field Handling

### 2.1 The 17-Element Vector Schema
OpenSky REST API returns aircraft data as an array of arrays (`states: [][]`). Accessing raw indexes throughout UI components introduces fragility. The application routes all raw vectors through `src/utils/aircraftParser.ts` to convert them into a typed `AircraftState` object.

### 2.2 Handling Nullable Transponder Fields
Not all aircraft transponders transmit all ADS-B parameters:
- **Callsign**: Trailing spaces are trimmed (`"IGO215  "` → `"IGO215"`). If empty or null, the UI displays `"N/A"` or the transponder `ICAO24` hex identifier.
- **Coordinates (Latitude & Longitude)**: Validated to ensure `latitude ∈ [-90, +90]` and `longitude ∈ [-180, +180]`. If coordinates are missing or invalid:
  - The aircraft is **excluded from Leaflet map markers** to prevent rendering at `[0, 0]` (Null Island).
  - The aircraft remains present in the surveillance table labeled with status `NO POS`.
- **Altitude**: Barometric and Geometric altitudes are tracked separately. Values of `0` (surface level) are explicitly distinguished from `null` (sensor unavailable). `0` displays as `0 ft (Surface)`, while `null` displays as `N/A`.
- **Vertical Rate**: Values between `-100 fpm` and `+100 fpm` are classified as `Level Flight` to prevent visual jitter caused by minor barometric fluctuations.
- **Squawk**: Parsed as a discrete 4-digit octal string. Special emergency squawks trigger highlighted visual indicators:
  - `7700`: General Emergency (MAYDAY)
  - `7600`: Radio Communications Failure (NORDO)
  - `7500`: Unlawful Interference (Hijack)

---

## 3. Data Freshness Classification

Aircraft position reports can lag behind the current wall-clock time due to receiver coverage gaps. Freshness is calculated dynamically:

$$\text{Age} = \text{Current Server Time} - (\text{timePosition} \mathbin{?} \text{lastContact})$$

| Status | Condition | Radar Visuals | Surveillance Table |
|---|---|---|---|
| **LIVE** | $\text{Age} < 60\text{s}$ | Solid color-coded by altitude (Emerald / Cyan / Indigo) | Glowing emerald `LIVE` badge |
| **STALE** | $60\text{s} \le \text{Age} < 180\text{s}$ | Amber marker (`#f59e0b`) | Amber `STALE` badge with age |
| **NO POS** | Missing valid Lat/Lon | Omitted from map rendering | Rose `NO POS` badge |

*Note: Position timestamps are derived strictly from the OpenSky transponder payload. Component re-renders never modify an aircraft's recorded timestamp.*

---

## 4. Sector Transition & Aircraft Lifecycle

### 4.1 Aircraft Entering Coverage
- When an `icao24` appears for the first time in an API response, the store creates a new entry with `firstSeen: Date.now()`, `lastSeen: Date.now()`, and `consecutiveMisses: 0`.

### 4.2 Aircraft Departing Coverage (Consecutive Miss Policy)
ADS-B receivers occasionally miss a packet due to line-of-sight obstruction or bank angle:
- If an aircraft is absent from an API response, its `consecutiveMisses` counter increments by 1 and its status becomes `STALE`.
- If an aircraft is absent for **5 consecutive polls** (~60 seconds), it is retired from the active `aircraftMap` snapshot.
- Crucially, its **movement history in `historyMap` is preserved** in client memory for the remainder of the session. If the operator selects the retired aircraft, they can still inspect its final recorded telemetry and flight profile.

---

## 5. Aircraft Movement History & Memory Constraints

### 5.1 Deduplication Algorithm
To prevent inflating history arrays when an aircraft is stationary on a taxiway or reporting identical positions:
- An observation is appended to `historyMap[icao24]` only if:
  1. Latitude or longitude has shifted by $\ge 0.0001^\circ$ (~11 meters), OR
  2. Altitude has changed by $\ge 50\text{ feet}$, OR
  3. No observation has been logged for that airframe yet.

### 5.2 Memory Bounds
- Each aircraft's breadcrumb trail is capped at **60 waypoints** using a FIFO circular buffer (`historyList.shift()`).
- This keeps overall memory consumption negligible even during prolonged surveillance sessions with hundreds of aircraft.
- Operators can manually clear an aircraft's recorded trail using the "Clear History" action.
- The UI explicitly clarifies that session breadcrumbs represent application-observed positions, not complete origin-to-destination flight logs.
