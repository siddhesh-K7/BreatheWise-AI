import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchActiveFiresSummary, getSeasonalFireBaseline } from '@/services/firms-service';
import { appCache } from '@/services/cache';

describe('NASA FIRMS Active Fire Telemetry Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NASA_FIRMS_MAP_KEY;
    delete process.env.FIRMS_MAP_KEY;
    appCache.clear();
    vi.restoreAllMocks();
  });

  it('falls back to seasonal baseline model when NASA FIRMS key is absent', async () => {
    const summary = await fetchActiveFiresSummary(28.61, 77.23, 150);
    expect(summary.isAvailable).toBe(true);
    expect(summary.isSeasonalBaseline).toBe(true);
    expect(summary.count24h).toBe(428);
    expect(summary.count72h).toBe(1385);
    expect(summary.advisoryText).toContain('Seasonal Baseline Model');
  });

  it('provides lower baseline fire count for non-northern agricultural belts', () => {
    const baseline = getSeasonalFireBaseline(13.08, 80.27, 150); // Chennai
    expect(baseline.count24h).toBe(24);
    expect(baseline.count72h).toBe(72);
    expect(baseline.isSeasonalBaseline).toBe(true);
  });

  it('fetches and parses live FIRMS CSV telemetry when MAP_KEY is configured', async () => {
    process.env.NASA_FIRMS_MAP_KEY = 'test_map_key_xyz';

    const mockCsv = `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
28.65,77.12,320.5,0.4,0.4,2026-11-17,0830,N,VIIRS,nominal,2.0NRT,295.2,14.2,D
28.70,77.15,315.2,0.4,0.4,2026-11-17,0830,N,VIIRS,nominal,2.0NRT,290.1,11.5,D`;

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(mockCsv, { status: 200 }));

    const summary = await fetchActiveFiresSummary(28.61, 77.23, 150);
    expect(summary.isAvailable).toBe(true);
    expect(summary.isSeasonalBaseline).toBe(false);
    expect(summary.count24h).toBe(2);
    expect(summary.advisoryText).toContain('NASA FIRMS VIIRS');
  });

  it('gracefully degrades to seasonal baseline when FIRMS returns HTTP 500 error', async () => {
    process.env.NASA_FIRMS_MAP_KEY = 'test_map_key_xyz';
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('Server Error', { status: 500 }));

    const summary = await fetchActiveFiresSummary(28.61, 77.23, 150);
    expect(summary.isAvailable).toBe(true);
    expect(summary.isSeasonalBaseline).toBe(true);
    expect(summary.count24h).toBe(428);
  });

  it('gracefully degrades to seasonal baseline upon timeout AbortController error', async () => {
    process.env.NASA_FIRMS_MAP_KEY = 'test_map_key_xyz';
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('AbortError'));

    const summary = await fetchActiveFiresSummary(28.61, 77.23, 150);
    expect(summary.isAvailable).toBe(true);
    expect(summary.isSeasonalBaseline).toBe(true);
  });
});
