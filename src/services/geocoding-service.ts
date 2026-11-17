/**
 * @fileoverview Geocoding client leveraging Open-Meteo Geocoding API for debounced city lookups.
 * Applies localized India-biased ranking and server-side TTL caching.
 */

import { z } from 'zod';
import { CACHE_TTL_MS } from '@/config/constants';
import { GeocodingResult } from '@/domain/types';
import { executeFetchWithTimeout } from './api-response';
import { appCache } from './cache';

const rawGeocodingResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string().default(''),
  country_code: z.string().default(''),
  admin1: z.string().optional(),
});

const rawGeocodingResponseSchema = z.object({
  results: z.array(rawGeocodingResultSchema).optional(),
});

/**
 * Searches geographic locations by query string with India-biased ranking and TTL caching.
 * @param query City or locality name to query
 * @param limit Maximum results to return (defaults to 5)
 */
export async function searchLocations(
  query: string,
  limit: number = 5
): Promise<GeocodingResult[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) {
    return [];
  }

  const cacheKey = `geocoding:${normalizedQuery}:${limit}`;
  const cached = appCache.get<GeocodingResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    normalizedQuery
  )}&count=10&language=en&format=json`;

  try {
    const res = await executeFetchWithTimeout(url, 5000);
    const rawData = await res.json();
    const parsed = rawGeocodingResponseSchema.safeParse(rawData);
    if (!parsed.success || !parsed.data.results) {
      return [];
    }

    const ranked = rankAndFilterResults(parsed.data.results, limit);
    appCache.set(cacheKey, ranked, CACHE_TTL_MS.GEOCODING);
    return ranked;
  } catch {
    return [];
  }
}

/**
 * Sorts geocoding candidates prioritizing Indian urban centers and slices to requested limit.
 */
function rankAndFilterResults(
  results: z.infer<typeof rawGeocodingResultSchema>[],
  limit: number
): GeocodingResult[] {
  const sorted = [...results].sort((a, b) => {
    const aIsIndia = a.country_code.toUpperCase() === 'IN';
    const bIsIndia = b.country_code.toUpperCase() === 'IN';
    if (aIsIndia && !bIsIndia) {
      return -1;
    }
    if (!aIsIndia && bIsIndia) {
      return 1;
    }
    return 0;
  });

  return sorted.slice(0, limit).map((r) => ({
    id: r.id,
    name: r.name,
    latitude: Number(r.latitude.toFixed(4)),
    longitude: Number(r.longitude.toFixed(4)),
    country: r.country,
    countryCode: r.country_code.toUpperCase(),
    admin1: r.admin1,
  }));
}
