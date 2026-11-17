/**
 * @fileoverview Serverless endpoint synthesizing Gemini structured air quality action plans.
 * Integrates schema validation, impact calculations, and deterministic fallback pipelines.
 */

import { fetchAirQualityAndWeather } from '@/services/aqi-service';
import { errorResponse, successResponse } from '@/services/api-response';
import { generateStructuredPlan } from '@/services/gemini-service';
import { calculateImpact } from '@/services/impact-calculator';
import { checkRateLimit, getClientIp } from '@/services/rate-limiter';
import { planRequestSchema } from '@/validators/schemas';

/**
 * Handles POST requests generating customized air quality action plans.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`plan:${ip}`, 30);
  if (!rateLimit.allowed) {
    return errorResponse(
      'Too many plan generation requests. Please wait a moment.',
      'TOO_MANY_REQUESTS',
      429
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON payload in request body.', 'INVALID_JSON', 400);
  }

  const validation = planRequestSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse(
      'Validation failed on request parameters.',
      'VALIDATION_ERROR',
      400,
      validation.error.flatten()
    );
  }

  const { location, profile, language } = validation.data;

  try {
    const { reading, weather } = await fetchAirQualityAndWeather(
      location.latitude,
      location.longitude
    );
    const impact = calculateImpact(reading.pm25, profile);
    const plan = await generateStructuredPlan(
      location,
      profile,
      reading,
      weather,
      impact,
      language
    );

    return successResponse(plan);
  } catch (err) {
    return errorResponse('Error synthesizing action plan.', 'INTERNAL_ERROR', 500, String(err));
  }
}
