/**
 * @fileoverview WAQI ground station cross-check serverless API route.
 * Returns nearest physical AQI station telemetry or graceful skip when token is absent.
 */

import { errorResponse, successResponse } from '@/services/api-response';
import { crossCheckAqi, fetchWaqiStationReading } from '@/services/waqi-service';
import { enforceRateLimit } from '@/services/rate-limiter';

const coordinateSchema = {
  parse(lat: string | null, lon: string | null): { lat: number; lon: number } | null {
    const latNum = parseFloat(lat ?? '');
    const lonNum = parseFloat(lon ?? '');
    if (
      isNaN(latNum) ||
      isNaN(lonNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lonNum < -180 ||
      lonNum > 180
    ) {
      return null;
    }
    return { lat: latNum, lon: lonNum };
  },
};

/**
 * Handles GET WAQI station cross-check requests by latitude and longitude.
 */
export async function GET(req: Request) {
  const rateLimitError = enforceRateLimit(req, 'waqi');
  if (rateLimitError) {
    return rateLimitError;
  }

  const { searchParams } = new URL(req.url);
  const coords = coordinateSchema.parse(searchParams.get('lat'), searchParams.get('lon'));

  if (!coords) {
    return errorResponse(
      'Invalid or missing lat/lon. lat must be in [-90, 90], lon in [-180, 180].',
      'VALIDATION_ERROR',
      400
    );
  }

  const modelAqiParam = searchParams.get('modelAqi');
  const modelAqi = modelAqiParam ? parseFloat(modelAqiParam) : undefined;

  try {
    const stationReading = await fetchWaqiStationReading(coords.lat, coords.lon);
    const crossCheck =
      modelAqi !== undefined && !isNaN(modelAqi)
        ? crossCheckAqi(modelAqi, stationReading)
        : null;

    return successResponse({ stationReading, crossCheck });
  } catch (err) {
    return errorResponse('Failed to fetch WAQI station data.', 'UPSTREAM_ERROR', 502, String(err));
  }
}
