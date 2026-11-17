/**
 * @fileoverview NASA FIRMS active fire detection serverless API route.
 * Returns regional thermal anomaly count or seasonal baseline when MAP_KEY is absent.
 */

import { errorResponse, successResponse } from '@/services/api-response';
import { fetchActiveFiresSummary } from '@/services/firms-service';
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
 * Handles GET fire activity requests by latitude and longitude.
 */
export async function GET(req: Request) {
  const rateLimitError = enforceRateLimit(req, 'fires');
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

  const radiusParam = searchParams.get('radius');
  const radiusKm = radiusParam ? parseInt(radiusParam, 10) : 150;

  try {
    const fireSummary = await fetchActiveFiresSummary(coords.lat, coords.lon, radiusKm);
    return successResponse(fireSummary);
  } catch (err) {
    return errorResponse(
      'Failed to fetch fire activity data.',
      'UPSTREAM_ERROR',
      502,
      String(err)
    );
  }
}
