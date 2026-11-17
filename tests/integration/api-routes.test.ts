import { describe, expect, it, vi } from 'vitest';
import { GET as healthHandler } from '@/app/api/health/route';
import { GET as aqiHandler } from '@/app/api/aqi/route';
import { POST as planHandler } from '@/app/api/recommendations/route';
import { POST as chatHandler } from '@/app/api/chat/route';
import * as rateLimiter from '@/services/rate-limiter';
import * as aqiService from '@/services/aqi-service';

describe('Serverless API Route Handlers Integration Tests', () => {
  it('GET /api/health returns 200 and healthy service telemetry', async () => {
    const res = await healthHandler();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('healthy');
  });

  it('GET /api/aqi rejects invalid coordinates with 400 validation error', async () => {
    const req = new Request('https://test.local/api/aqi?lat=140&lon=77.2&city=Invalid');
    const res = await aqiHandler(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/aqi returns 429 when rate limiter blocks client', async () => {
    vi.spyOn(rateLimiter, 'checkRateLimit').mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetMs: 5000,
    });

    const req = new Request('https://test.local/api/aqi?lat=28.61&lon=77.23&city=Delhi');
    const res = await aqiHandler(req);

    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('GET /api/aqi returns 502 on upstream telemetry exception', async () => {
    vi.spyOn(aqiService, 'fetchAirQualityAndWeather').mockRejectedValueOnce(new Error('Open-Meteo timeout'));

    const req = new Request('https://test.local/api/aqi?lat=28.61&lon=77.23&city=Delhi');
    const res = await aqiHandler(req);

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error.code).toBe('UPSTREAM_ERROR');
  });

  it('GET /api/aqi returns 200 for valid geographic coordinates with mocked Open-Meteo', async () => {
    const mockAqi = {
      current: { us_aqi: 180, pm2_5: 90, pm10: 160, nitrogen_dioxide: 30, ozone: 25, sulphur_dioxide: 12, carbon_monoxide: 500 },
      hourly: { time: ['2026-11-17T06:00'], pm2_5: [90], us_aqi: [180] },
    };
    const mockWeather = {
      current: { temperature_2m: 16, relative_humidity_2m: 70, wind_speed_10m: 4.5 },
      hourly: { boundary_layer_height: [220] },
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const u = String(url);
      if (u.includes('air-quality')) {
        return new Response(JSON.stringify(mockAqi), { status: 200 });
      }
      return new Response(JSON.stringify(mockWeather), { status: 200 });
    });

    const req = new Request('https://test.local/api/aqi?lat=28.61&lon=77.23&city=Delhi');
    const res = await aqiHandler(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.reading.usAqi).toBe(180);

    fetchSpy.mockRestore();
  });

  it('POST /api/recommendations rejects malformed JSON and invalid schema', async () => {
    const reqMalformed = new Request('https://test.local/api/recommendations', {
      method: 'POST',
      body: 'invalid-json{',
    });
    const resMalformed = await planHandler(reqMalformed);
    expect(resMalformed.status).toBe(400);

    const reqInvalidSchema = new Request('https://test.local/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: { latitude: 999 } }),
    });
    const resInvalidSchema = await planHandler(reqInvalidSchema);
    expect(resInvalidSchema.status).toBe(400);
  });

  it('POST /api/recommendations returns 429 when rate limited', async () => {
    vi.spyOn(rateLimiter, 'checkRateLimit').mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetMs: 5000,
    });

    const req = new Request('https://test.local/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await planHandler(req);
    expect(res.status).toBe(429);
  });

  it('POST /api/recommendations generates an action plan with fallback safety', async () => {
    const payload = {
      location: { latitude: 28.61, longitude: 77.23, cityName: 'Delhi' },
      profile: {
        hasChildren: true,
        hasElderly: false,
        respiratorySensitivity: false,
        commuteMode: 'car',
        dailyCommuteKm: 20,
        homeVentilation: 'standard',
        hasPurifier: false,
        cookingFuel: 'lpg-induction',
        workSetting: 'hybrid',
      },
      language: 'en',
    };

    const req = new Request('https://test.local/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await planHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.dailyRoutines).toBeDefined();
    expect(json.data.quantifiedImpact).toBeDefined();
  });

  it('POST /api/chat handles rate limits, invalid JSON, and invalid payloads', async () => {
    vi.spyOn(rateLimiter, 'checkRateLimit').mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetMs: 5000,
    });

    const reqThrottled = new Request('https://test.local/api/chat', { method: 'POST' });
    const resThrottled = await chatHandler(reqThrottled);
    expect(resThrottled.status).toBe(429);

    const reqMalformed = new Request('https://test.local/api/chat', {
      method: 'POST',
      body: 'bad-json{',
    });
    const resMalformed = await chatHandler(reqMalformed);
    expect(resMalformed.status).toBe(400);

    const reqInvalid = new Request('https://test.local/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    });
    const resInvalid = await chatHandler(reqInvalid);
    expect(resInvalid.status).toBe(400);
  });

  it('POST /api/chat establishes streaming response with safe defaults', async () => {
    const req = new Request('https://test.local/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is PM2.5?', language: 'en', currentAqi: 150 }),
    });

    const res = await chatHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
  });
});
