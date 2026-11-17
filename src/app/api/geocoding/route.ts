/**
 * @fileoverview Autocomplete geocoding serverless API route.
 * Handles debounced locality searches with India-biased ranking.
 */

import { errorResponse, successResponse } from '@/services/api-response';
import { searchLocations } from '@/services/geocoding-service';
import { checkRateLimit, getClientIp } from '@/services/rate-limiter';
import { geocodingQuerySchema } from '@/validators/schemas';

/**
 * Handles GET geocoding queries with query parameter validation and rate limiting.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`geocoding:${ip}`);
  if (!rateLimit.allowed) {
    return errorResponse('Rate limit exceeded. Please wait a moment.', 'TOO_MANY_REQUESTS', 429);
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get('q') || searchParams.get('name') || '';

  const validation = geocodingQuerySchema.safeParse({ name, count: 5 });
  if (!validation.success) {
    return errorResponse(
      'Search query must be at least 2 characters.',
      'VALIDATION_ERROR',
      400,
      validation.error.flatten()
    );
  }

  try {
    const results = await searchLocations(validation.data.name, 5);
    return successResponse(results);
  } catch (err) {
    return errorResponse('Failed to execute geocoding query.', 'UPSTREAM_ERROR', 502, String(err));
  }
}
