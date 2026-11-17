/**
 * @fileoverview WAQI (aqicn.org) real-time ground station cross-check telemetry client.
 * Provides physical station validation against gridded atmospheric models with disagreement detection.
 */

import { z } from 'zod';
import { CACHE_TTL_MS } from '@/config/constants';
import { AqiCrossCheck, WaqiStationReading } from '@/domain/types';
import { executeFetchWithTimeout } from './api-response';
import { appCache } from './cache';

export const WAQI_DISAGREEMENT_THRESHOLD = 50;

const waqiDataSchema = z.object({
  aqi: z.number(),
  idx: z.number().optional(),
  city: z
    .object({
      name: z.string().optional(),
      geo: z.array(z.number()).optional(),
    })
    .optional(),
  dominentpol: z.string().optional(),
  time: z
    .object({
      s: z.string().optional(),
      iso: z.string().optional(),
    })
    .optional(),
});

const rawWaqiResponseSchema = z.object({
  status: z.string(),
  data: z.union([waqiDataSchema, z.string()]).optional(),
});

type RawWaqiResponse = z.infer<typeof rawWaqiResponseSchema>;

/**
 * Fetches the nearest ground monitoring station telemetry from WAQI (aqicn.org).
 * Degrades gracefully if token is absent or upstream fails.
 */
export async function fetchWaqiStationReading(
  lat: number,
  lon: number
): Promise<WaqiStationReading> {
  const token = process.env.WAQI_API_TOKEN || process.env.AQICN_API_TOKEN;
  if (!token) {
    return {
      isAvailable: false,
      statusReason: 'WAQI token not configured in vault (operating in Open-Meteo standalone mode)',
    };
  }

  const quantCoord = appCache.quantizeCoordinates(lat, lon);
  const cacheKey = `waqi:${quantCoord}`;
  const cached = appCache.get<WaqiStationReading>(cacheKey);
  if (cached) {
    return cached;
  }

  const [latQ, lonQ] = quantCoord.split(',');
  const url = `https://api.waqi.info/feed/geo:${latQ};${lonQ}/?token=${token}`;

  try {
    const rawData = await fetchWaqiPayload(url);
    const reading = parseWaqiPayload(rawData, lat, lon);
    appCache.set(cacheKey, reading, CACHE_TTL_MS.AQI_DATA);
    return reading;
  } catch (err) {
    return {
      isAvailable: false,
      statusReason: `WAQI station telemetry offline (${err instanceof Error ? err.message : 'timeout'})`,
    };
  }
}

/**
 * Compares gridded model AQI against ground station telemetry and determines safety AQI.
 */
export function crossCheckAqi(modelAqi: number, stationReading: WaqiStationReading): AqiCrossCheck {
  if (!stationReading.isAvailable || stationReading.stationAqi === undefined) {
    return {
      modelAqi,
      stationReading,
      disagreementDetected: false,
      deviation: 0,
      effectiveSafetyAqi: modelAqi,
    };
  }

  const deviation = Math.abs(modelAqi - stationReading.stationAqi);
  const disagreementDetected = deviation > WAQI_DISAGREEMENT_THRESHOLD;
  const effectiveSafetyAqi = Math.max(modelAqi, stationReading.stationAqi);

  return {
    modelAqi,
    stationReading,
    disagreementDetected,
    deviation,
    effectiveSafetyAqi,
  };
}

/**
 * Executes fetch with a 5000ms AbortController timeout.
 */
async function fetchWaqiPayload(url: string): Promise<RawWaqiResponse> {
  const res = await executeFetchWithTimeout(url, 5000);
  const json = await res.json();
  return rawWaqiResponseSchema.parse(json);
}

/**
 * Parses and maps validated WAQI payload into domain WaqiStationReading.
 */
function parseWaqiPayload(
  raw: RawWaqiResponse,
  userLat: number,
  userLon: number
): WaqiStationReading {
  if (raw.status !== 'ok' || !raw.data || typeof raw.data === 'string') {
    return {
      isAvailable: false,
      statusReason: typeof raw.data === 'string' ? raw.data : 'Station data unavailable',
    };
  }

  const stationData = raw.data;
  let distanceKm: number | undefined;
  if (stationData.city?.geo && stationData.city.geo.length >= 2) {
    distanceKm = calculateHaversineDistance(
      userLat,
      userLon,
      stationData.city.geo[0] ?? userLat,
      stationData.city.geo[1] ?? userLon
    );
  }

  return {
    isAvailable: true,
    stationName: stationData.city?.name || 'Nearest Ground Station',
    stationAqi: Math.round(stationData.aqi),
    dominantPollutant: stationData.dominentpol?.toUpperCase() || 'PM2.5',
    timestamp: stationData.time?.iso || stationData.time?.s || new Date().toISOString(),
    distanceKm,
  };
}

/**
 * Approximates Great-circle distance between two coordinates in kilometers.
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}
