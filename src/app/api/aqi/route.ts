/**
 * @fileoverview Serverless endpoint retrieving live atmospheric telemetry from Open-Meteo.
 * Validates coordinate bounding boxes and applies spatial TTL caching.
 */

import { fetchAirQualityAndWeather } from '@/services/aqi-service';
import { errorResponse, successResponse } from '@/services/api-response';
import { checkRateLimit, getClientIp } from '@/services/rate-limiter';
import { locationQuerySchema } from '@/validators/schemas';

/**
 * Handles GET telemetry requests by latitude and longitude.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return errorResponse('Rate limit exceeded. Please wait a moment.', 'TOO_MANY_REQUESTS', 429);
  }

  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');
  const city = searchParams.get('city') || 'Detected Location';

  const lat = parseFloat(latStr || '');
  const lon = parseFloat(lonStr || '');

  const validation = locationQuerySchema.safeParse({
    latitude: lat,
    longitude: lon,
    cityName: city,
  });
  if (!validation.success) {
    return errorResponse(
      'Invalid coordinates or city name.',
      'VALIDATION_ERROR',
      400,
      validation.error.flatten()
    );
  }

  try {
    const { reading, weather } = await fetchAirQualityAndWeather(lat, lon);
    return successResponse({
      location: validation.data,
      reading,
      weather,
    });
  } catch (err) {
    return errorResponse(
      'Failed to fetch atmospheric telemetry.',
      'UPSTREAM_ERROR',
      502,
      String(err)
    );
  }
}
