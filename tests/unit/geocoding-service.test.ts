import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchLocations } from '@/services/geocoding-service';
import { appCache } from '@/services/cache';

describe('Open-Meteo Geocoding Service Unit Tests', () => {
  beforeEach(() => {
    appCache.clear();
    vi.restoreAllMocks();
  });

  it('returns empty array when query length is less than 2 characters', async () => {
    const results = await searchLocations('a');
    expect(results).toEqual([]);
  });

  it('ranks Indian cities ahead of international results and applies 5-result limit', async () => {
    const mockPayload = {
      results: [
        { id: 1, name: 'Delhi', latitude: 42.45, longitude: -74.91, country: 'United States', country_code: 'US' },
        { id: 2, name: 'Delhi NCR', latitude: 28.61, longitude: 77.23, country: 'India', country_code: 'IN', admin1: 'Delhi' },
        { id: 3, name: 'Delhi', latitude: 35.82, longitude: -90.39, country: 'United States', country_code: 'US' },
      ],
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(mockPayload), { status: 200 }));

    const results = await searchLocations('delhi', 5);
    expect(results).toHaveLength(3);
    expect(results[0]?.countryCode).toBe('IN');
    expect(results[0]?.name).toBe('Delhi NCR');
  });

  it('retrieves cached results on subsequent identical queries without network call', async () => {
    const mockPayload = {
      results: [
        { id: 10, name: 'Chennai', latitude: 13.08, longitude: 80.27, country: 'India', country_code: 'IN' },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify(mockPayload), { status: 200 }));

    const first = await searchLocations('chennai');
    expect(first).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const second = await searchLocations('chennai');
    expect(second).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // Cached
  });

  it('handles upstream HTTP error responses gracefully by returning empty array', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('Error', { status: 500 }));
    const results = await searchLocations('mumbai');
    expect(results).toEqual([]);
  });

  it('handles malformed payload structure gracefully by returning empty array', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ not_results: 123 }), { status: 200 }));
    const results = await searchLocations('kolkata');
    expect(results).toEqual([]);
  });

  it('handles AbortController network timeouts gracefully', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('AbortError: The operation was aborted.'));
    const results = await searchLocations('bengaluru');
    expect(results).toEqual([]);
  });
});
