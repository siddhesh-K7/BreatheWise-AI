'use client';

import { useCallback, useEffect, useState } from 'react';
import { METRO_PRESETS } from '@/config/constants';
import {
  AqiCrossCheck,
  AqiReading,
  FirmsFireSummary,
  LocationQuery,
  WaqiStationReading,
  WeatherContext,
} from '@/domain/types';

interface UseAqiReturn {
  location: LocationQuery;
  reading: AqiReading | null;
  weather: WeatherContext | null;
  stationReading: WaqiStationReading | null;
  crossCheck: AqiCrossCheck | null;
  fireSummary: FirmsFireSummary | null;
  isLoading: boolean;
  error: string | null;
  setLocation: (loc: LocationQuery) => void;
  selectPreset: (presetId: string) => void;
  requestGeolocation: () => void;
}

const DEFAULT_LOCATION: LocationQuery = {
  cityName: METRO_PRESETS[0].cityName,
  stateName: METRO_PRESETS[0].state,
  latitude: METRO_PRESETS[0].latitude,
  longitude: METRO_PRESETS[0].longitude,
};

/**
 * Custom hook orchestrating geolocation, preset selection, and telemetry ingestion.
 */
export function useAqi(): UseAqiReturn {
  const [location, setLocation] = useState<LocationQuery>(DEFAULT_LOCATION);
  const [reading, setReading] = useState<AqiReading | null>(null);
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [stationReading, setStationReading] = useState<WaqiStationReading | null>(null);
  const [crossCheck, setCrossCheck] = useState<AqiCrossCheck | null>(null);
  const [fireSummary, setFireSummary] = useState<FirmsFireSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async (loc: LocationQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/aqi?lat=${loc.latitude}&lon=${loc.longitude}&city=${encodeURIComponent(loc.cityName)}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to retrieve telemetry');
      }
      setReading(data.data.reading);
      setWeather(data.data.weather);
      setStationReading(data.data.stationReading || null);
      setCrossCheck(data.data.crossCheck || null);
      setFireSummary(data.data.fireSummary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Telemetry request failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry(location);
  }, [location, fetchTelemetry]);

  const selectPreset = (presetId: string) => {
    const found = METRO_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setLocation({
        cityName: found.cityName,
        stateName: found.state,
        latitude: found.latitude,
        longitude: found.longitude,
      });
    }
  };

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          cityName: 'My Location',
          latitude: Number(pos.coords.latitude.toFixed(2)),
          longitude: Number(pos.coords.longitude.toFixed(2)),
        });
      },
      (geoErr) => {
        setIsLoading(false);
        setError(`Location access declined (${geoErr.message}). Using metropolitan preset.`);
      },
      { timeout: 8000 }
    );
  };

  return {
    location,
    reading,
    weather,
    stationReading,
    crossCheck,
    fireSummary,
    isLoading,
    error,
    setLocation,
    selectPreset,
    requestGeolocation,
  };
}
