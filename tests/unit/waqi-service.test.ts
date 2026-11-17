import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crossCheckAqi, fetchWaqiStationReading } from '@/services/waqi-service';
import { appCache } from '@/services/cache';

describe('WAQI Ground Station Cross-Check Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.WAQI_API_TOKEN;
    delete process.env.AQICN_API_TOKEN;
    appCache.clear();
    vi.restoreAllMocks();
  });

  it('cleanly skips station fetch when WAQI token is absent from environment/vault', async () => {
    const reading = await fetchWaqiStationReading(28.61, 77.23);
    expect(reading.isAvailable).toBe(false);
    expect(reading.statusReason).toContain('token not configured');
  });

  it('parses valid WAQI station telemetry when token is configured', async () => {
    process.env.WAQI_API_TOKEN = 'test_token_123';

    const mockWaqiResponse = {
      status: 'ok',
      data: {
        aqi: 245,
        idx: 5678,
        city: { name: 'US Embassy Delhi', geo: [28.59, 77.19] },
        dominentpol: 'pm25',
        time: { iso: '2026-11-17T08:00:00+05:30' },
      },
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockWaqiResponse), { status: 200 })
    );

    const reading = await fetchWaqiStationReading(28.61, 77.23);
    expect(reading.isAvailable).toBe(true);
    expect(reading.stationAqi).toBe(245);
    expect(reading.stationName).toBe('US Embassy Delhi');
    expect(reading.dominantPollutant).toBe('PM25');
    expect(reading.distanceKm).toBeGreaterThan(0);
  });

  it('parses valid WAQI station telemetry when AQICN_API_TOKEN fallback is configured', async () => {
    process.env.AQICN_API_TOKEN = 'test_aqicn_456';

    const mockWaqiResponse = {
      status: 'ok',
      data: {
        aqi: 190,
        city: { name: 'Kolkata Station' },
      },
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockWaqiResponse), { status: 200 })
    );

    const reading = await fetchWaqiStationReading(22.57, 88.36);
    expect(reading.isAvailable).toBe(true);
    expect(reading.stationAqi).toBe(190);
  });

  it('detects source disagreement when deviation exceeds 50 AQI points and elevates safety AQI', () => {
    const station = {
      isAvailable: true,
      stationName: 'Delhi Pusa Station',
      stationAqi: 310,
      dominantPollutant: 'PM2.5',
      timestamp: '2026-11-17T08:00:00Z',
      distanceKm: 3.2,
    };

    const crossCheck = crossCheckAqi(220, station); // Model 220 vs Station 310 = diff 90
    expect(crossCheck.disagreementDetected).toBe(true);
    expect(crossCheck.deviation).toBe(90);
    expect(crossCheck.effectiveSafetyAqi).toBe(310);
  });

  it('approves agreement when deviation is within 50 AQI points', () => {
    const station = {
      isAvailable: true,
      stationName: 'Chennai US Consulate',
      stationAqi: 85,
      dominantPollutant: 'PM2.5',
      timestamp: '2026-11-17T08:00:00Z',
      distanceKm: 2.1,
    };

    const crossCheck = crossCheckAqi(95, station); // diff 10 <= 50
    expect(crossCheck.disagreementDetected).toBe(false);
    expect(crossCheck.deviation).toBe(10);
    expect(crossCheck.effectiveSafetyAqi).toBe(95);
  });

  it('gracefully degrades when upstream returns HTTP 429 or 500 error', async () => {
    process.env.WAQI_API_TOKEN = 'test_token_123';
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('Too Many Requests', { status: 429 }));

    const reading = await fetchWaqiStationReading(28.61, 77.23);
    expect(reading.isAvailable).toBe(false);
    expect(reading.statusReason).toContain('offline');
  });

  it('serves station reading from memory cache on subsequent calls within TTL', async () => {
    process.env.WAQI_API_TOKEN = 'test_token_123';
    const mockWaqiResponse = {
      status: 'ok',
      data: {
        aqi: 150,
        city: { name: 'Cached Station', geo: [28.6, 77.2] },
        time: { s: '2026-11-17 12:00:00' },
      },
    };
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockWaqiResponse), { status: 200 })
    );

    const first = await fetchWaqiStationReading(28.61, 77.23);
    const second = await fetchWaqiStationReading(28.61, 77.23);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(first.stationAqi).toBe(150);
    expect(second.stationAqi).toBe(150);
  });

  it('handles error status payload or string data message from WAQI', async () => {
    process.env.WAQI_API_TOKEN = 'test_token_123';
    const mockWaqiResponse = {
      status: 'error',
      data: 'Unknown city station',
    };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockWaqiResponse), { status: 200 })
    );

    const reading = await fetchWaqiStationReading(28.61, 77.23);
    expect(reading.isAvailable).toBe(false);
    expect(reading.statusReason).toBe('Unknown city station');
  });

  it('handles station data without city coordinates or timestamps', async () => {
    process.env.WAQI_API_TOKEN = 'test_token_123';
    const mockWaqiResponse = {
      status: 'ok',
      data: {
        aqi: 75,
      },
    };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockWaqiResponse), { status: 200 })
    );

    const reading = await fetchWaqiStationReading(28.61, 77.23);
    expect(reading.isAvailable).toBe(true);
    expect(reading.stationAqi).toBe(75);
    expect(reading.distanceKm).toBeUndefined();
  });

  it('gracefully handles timeout AbortController rejection', async () => {
    process.env.WAQI_API_TOKEN = 'test_token_123';
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('AbortError'));

    const reading = await fetchWaqiStationReading(28.61, 77.23);
    expect(reading.isAvailable).toBe(false);
    expect(reading.statusReason).toContain('offline');
  });
});
