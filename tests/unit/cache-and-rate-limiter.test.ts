import { describe, expect, it } from 'vitest';
import { appCache } from '@/services/cache';
import { checkRateLimit, getClientIp } from '@/services/rate-limiter';

describe('Memory Cache & Rate Limiter Unit Tests', () => {
  it('stores, retrieves, and expires cache entries correctly', async () => {
    appCache.set('test-key', { sample: 42 }, 5000);
    expect(appCache.get<{ sample: number }>('test-key')?.sample).toBe(42);
    expect(appCache.has('test-key')).toBe(true);

    appCache.set('test-key-exp', { sample: 99 }, 15);
    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(appCache.get('test-key-exp')).toBeNull();
    expect(appCache.has('test-key-exp')).toBe(false);
  });

  it('quantizes spatial coordinates to 2 decimal places for cache hit consistency', () => {
    const key1 = appCache.quantizeCoordinates(28.613928, 77.209021);
    const key2 = appCache.quantizeCoordinates(28.614999, 77.206555);
    expect(key1).toBe('28.61,77.21');
    expect(key2).toBe('28.61,77.21');
    expect(key1).toBe(key2);
  });

  it('permits requests within quota and throttles excess requests in rate limiter', () => {
    const id = `test-ip-${Date.now()}`;
    const limit = 4;

    for (let i = 0; i < limit; i++) {
      const res = checkRateLimit(id, limit, 5000);
      expect(res.allowed).toBe(true);
    }

    const blocked = checkRateLimit(id, limit, 5000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('extracts client IP from x-forwarded-for, x-real-ip, or fallback', () => {
    const reqForwarded = new Request('https://test.local', {
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
    });
    expect(getClientIp(reqForwarded)).toBe('203.0.113.195');

    const reqRealIp = new Request('https://test.local', {
      headers: { 'x-real-ip': '198.51.100.1' },
    });
    expect(getClientIp(reqRealIp)).toBe('198.51.100.1');

    const reqFallback = new Request('https://test.local');
    expect(getClientIp(reqFallback)).toBe('127.0.0.1');
  });

  it('handles spaces and multiple hops in x-forwarded-for header', () => {
    const reqMulti = new Request('https://test.local', {
      headers: { 'x-forwarded-for': '  103.21.244.2 , 172.64.0.1, 10.0.0.1  ' },
    });
    expect(getClientIp(reqMulti)).toBe('103.21.244.2');
  });

  it('allows cache overwrite with updated payload', () => {
    appCache.set('mutable-key', { version: 1 }, 10000);
    expect(appCache.get<{ version: number }>('mutable-key')?.version).toBe(1);

    appCache.set('mutable-key', { version: 2 }, 10000);
    expect(appCache.get<{ version: number }>('mutable-key')?.version).toBe(2);
  });

  it('resets rate limit counter after the window expires', async () => {
    const burstId = `burst-test-${Date.now()}`;
    const windowMs = 50;
    const limit = 2;

    expect(checkRateLimit(burstId, limit, windowMs).allowed).toBe(true);
    expect(checkRateLimit(burstId, limit, windowMs).allowed).toBe(true);
    expect(checkRateLimit(burstId, limit, windowMs).allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, windowMs + 20));
    expect(checkRateLimit(burstId, limit, windowMs).allowed).toBe(true);
  });
});
