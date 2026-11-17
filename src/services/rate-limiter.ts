/**
 * @fileoverview High-performance sliding-window in-memory IP rate limiter.
 * Protects serverless API endpoints against scraping and denial-of-service attempts.
 */

import { RATE_LIMITS } from '@/config/constants';
import { errorResponse } from './api-response';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Clears all stored rate-limit records. Intended for use in test environments only.
 */
export function clearRateLimitStore(): void {
  rateLimitMap.clear();
}

/**
 * Checks whether an incoming request from an identifier is within the rate limit.
 * @param identifier Client IP address or token identifier
 * @param maxRequests Maximum allowable requests within window
 * @param windowMs Time window duration in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = RATE_LIMITS.MAX_REQUESTS_GENERAL,
  windowMs: number = RATE_LIMITS.WINDOW_MS
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetMs: windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetMs: Math.max(0, record.resetTime - now) };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetMs: Math.max(0, record.resetTime - now),
  };
}

/**
 * Extracts client IP identifier from standard proxy headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || '127.0.0.1';
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Verifies request rate limit and returns standardized error response if exceeded.
 */
export function enforceRateLimit(
  req: Request,
  prefix: string = 'general',
  maxRequests: number = RATE_LIMITS.MAX_REQUESTS_GENERAL
): ReturnType<typeof errorResponse> | null {
  const ip = getClientIp(req);
  const check = checkRateLimit(`${prefix}:${ip}`, maxRequests);
  if (!check.allowed) {
    return errorResponse('Rate limit exceeded. Please wait a moment.', 'TOO_MANY_REQUESTS', 429);
  }
  return null;
}
