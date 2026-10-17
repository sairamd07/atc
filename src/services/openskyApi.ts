import { AircraftState, GeoBounds } from '../types/aircraft';
import { parseStateVector } from '../utils/aircraftParser';

export interface OpenSkyResponse {
  time: number;
  states: unknown[][] | null;
}

export interface FetchStatesResult {
  states: AircraftState[];
  serverTime: number;
  durationMs: number;
}

export class OpenSkyApiError extends Error {
  status?: number;
  retryAfterSeconds?: number;
  isRateLimit: boolean;
  isTimeout: boolean;

  constructor(message: string, status?: number, retryAfterSeconds?: number) {
    super(message);
    this.name = 'OpenSkyApiError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
    this.isRateLimit = status === 429;
    this.isTimeout = status === 504 || message.includes('ETIMEDOUT') || message.includes('timed out');
  }
}

/**
 * OpenSky Network REST API Service with strict timeout and error recovery
 */
export async function fetchAircraftStates(
  bounds: GeoBounds,
  externalSignal?: AbortSignal
): Promise<FetchStatesResult> {
  const startTime = performance.now();

  const params = new URLSearchParams({
    lamin: bounds.lamin.toFixed(4),
    lomin: bounds.lomin.toFixed(4),
    lamax: bounds.lamax.toFixed(4),
    lomax: bounds.lomax.toFixed(4),
  });

  const proxyUrl = `/api/opensky/states/all?${params.toString()}`;

  // Enforce a strict 6.5s timeout on requests to prevent hanging on ETIMEDOUT
  const timeoutController = new AbortController();
  const timeoutTimer = setTimeout(() => {
    timeoutController.abort(new Error('Request timed out'));
  }, 6500);

  // Link external signal if provided
  const combinedSignal = externalSignal;
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => timeoutController.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(proxyUrl, {
      signal: timeoutController.signal,
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (err: unknown) {
    clearTimeout(timeoutTimer);

    if (externalSignal?.aborted) {
      throw err; // Parent cancellation
    }

    if (timeoutController.signal.aborted) {
      throw new OpenSkyApiError(
        'OpenSky Network connection timed out (ETIMEDOUT). The external server (194.209.200.34) is currently unreachable from this environment.',
        504,
        20
      );
    }

    throw new OpenSkyApiError(
      'Unable to connect to OpenSky Network (Network/Timeout error).',
      504,
      15
    );
  } finally {
    clearTimeout(timeoutTimer);
  }

  // Handle HTTP status errors
  if (!response.ok) {
    const status = response.status;
    let retryAfter = 20;

    const retryHeader =
      response.headers.get('Retry-After') ||
      response.headers.get('X-Rate-Limit-Retry-After-Seconds');
    if (retryHeader) {
      const parsed = parseInt(retryHeader, 10);
      if (!isNaN(parsed) && parsed > 0) {
        retryAfter = parsed;
      }
    }

    if (status === 504) {
      throw new OpenSkyApiError(
        'OpenSky Network server connection timed out (504 Gateway Timeout). Swiss servers are temporarily unreachable.',
        504,
        retryAfter
      );
    } else if (status === 429) {
      throw new OpenSkyApiError(
        'OpenSky rate limit reached (HTTP 429). Anonymous calls are limited to 1 req/10s. Polling is backing off.',
        429,
        retryAfter
      );
    } else if (status === 401 || status === 403) {
      throw new OpenSkyApiError(
        `OpenSky authentication error (HTTP ${status}). The provided API key or credentials are invalid or expired.`,
        status
      );
    } else if (status >= 500) {
      throw new OpenSkyApiError(
        `OpenSky service temporarily unavailable (HTTP ${status} server error). Retrying with backoff.`,
        status,
        15
      );
    } else {
      throw new OpenSkyApiError(
        `OpenSky API returned HTTP error ${status} ${response.statusText}`,
        status
      );
    }
  }

  let data: OpenSkyResponse;
  try {
    data = await response.json();
  } catch {
    throw new OpenSkyApiError('Received malformed JSON response from OpenSky Network.');
  }

  const serverTime = typeof data.time === 'number' ? data.time : Math.floor(Date.now() / 1000);
  const rawStates = Array.isArray(data.states) ? data.states : [];

  const parsedAircraft: AircraftState[] = [];
  for (const vector of rawStates) {
    const parsed = parseStateVector(vector, serverTime);
    if (parsed) {
      parsedAircraft.push(parsed);
    }
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    states: parsedAircraft,
    serverTime,
    durationMs,
  };
}
