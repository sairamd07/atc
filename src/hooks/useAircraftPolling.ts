import { useCallback, useEffect, useRef } from 'react';
import { fetchAircraftStates, OpenSkyApiError } from '../services/openskyApi';
import { getSimulatedAircraft } from '../services/mockData';
import { useAircraftStore } from '../store/aircraftStore';

export function useAircraftPolling() {
  const {
    activeBounds,
    selectedRegion,
    isLiveMode,
    isAutoRefresh,
    pollingIntervalSeconds,
    rateLimitCountdown,
    aircraftMap,
    processApiSnapshot,
    setLoading,
    setError,
    setLiveMode,
    decrementRateLimitCountdown,
  } = useAircraftStore();

  const abortControllerRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Execute a single fetch cycle
  const executePoll = useCallback(async () => {
    // Prevent overlapping requests or execution during active rate-limit backoff
    if (inFlightRef.current || rateLimitCountdown > 0) {
      return;
    }

    // Cancel any previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    inFlightRef.current = true;
    setLoading(true);

    try {
      if (!isLiveMode) {
        // Simulation / Demo Mode
        await new Promise((resolve) => setTimeout(resolve, 150));
        const simulated = getSimulatedAircraft(
          selectedRegion.id,
          activeBounds,
          pollingIntervalSeconds
        );
        processApiSnapshot(simulated, Math.floor(Date.now() / 1000), 150);
      } else {
        // Real OpenSky Network API Call
        const result = await fetchAircraftStates(activeBounds, controller.signal);
        processApiSnapshot(result.states, result.serverTime, result.durationMs);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      const isTimeoutError =
        (err instanceof OpenSkyApiError && (err.isTimeout || err.status === 504)) ||
        (err instanceof Error &&
          (err.message.includes('ETIMEDOUT') ||
            err.message.includes('timed out') ||
            err.message.includes('Network/Timeout')));

      // If live mode failed on initial load with timeout or no aircraft cached:
      // Fallback to realistic demo simulation so the user immediately gets a fully functional radar!
      const hasExistingData = Object.keys(aircraftMap).length > 0;
      if (!hasExistingData || isTimeoutError) {
        const simulated = getSimulatedAircraft(
          selectedRegion.id,
          activeBounds,
          pollingIntervalSeconds
        );
        processApiSnapshot(simulated, Math.floor(Date.now() / 1000), 100);
        // Switch to demo mode so subsequent polls don't repeatedly lock up
        setLiveMode(false);
      }

      if (err instanceof OpenSkyApiError) {
        setError({
          message: err.message,
          status: err.status,
          retryAfterSeconds: err.retryAfterSeconds,
          timestamp: Date.now(),
          isRateLimit: err.isRateLimit,
        });
      } else {
        setError({
          message:
            err instanceof Error
              ? err.message
              : 'Unknown error occurred while contacting OpenSky network.',
          timestamp: Date.now(),
          isRateLimit: false,
        });
      }
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [
    activeBounds,
    selectedRegion.id,
    isLiveMode,
    pollingIntervalSeconds,
    rateLimitCountdown,
    aircraftMap,
    processApiSnapshot,
    setLoading,
    setError,
    setLiveMode,
  ]);

  // Rate-limit countdown ticker (ticks every 1s)
  useEffect(() => {
    if (rateLimitCountdown > 0) {
      countdownIntervalRef.current = window.setInterval(() => {
        decrementRateLimitCountdown();
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [rateLimitCountdown, decrementRateLimitCountdown]);

  // Auto-refresh polling loop
  useEffect(() => {
    executePoll();

    if (!isAutoRefresh) {
      return;
    }

    timerRef.current = window.setInterval(() => {
      executePoll();
    }, pollingIntervalSeconds * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executePoll, isAutoRefresh, pollingIntervalSeconds, activeBounds, isLiveMode]);

  const triggerManualRefresh = useCallback(() => {
    if (rateLimitCountdown > 0) return;
    executePoll();
  }, [executePoll, rateLimitCountdown]);

  return {
    triggerManualRefresh,
  };
}
