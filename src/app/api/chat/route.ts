/**
 * @fileoverview Streaming serverless endpoint for conversational Gemini air quality inquiries.
 * Dispatches Server-Sent chunked streams with strict prompt injection resistance.
 */

import { errorResponse } from '@/services/api-response';
import { streamAirWiseChat } from '@/services/gemini-service';
import { checkRateLimit, getClientIp } from '@/services/rate-limiter';
import { chatRequestSchema } from '@/validators/schemas';

export const maxDuration = 30;

/**
 * Handles POST requests initiating streaming Gemini conversational assistance.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`chat:${ip}`, 20);
  if (!rateLimit.allowed) {
    return errorResponse('Too many chat queries. Please slow down.', 'TOO_MANY_REQUESTS', 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON payload in request body.', 'INVALID_JSON', 400);
  }

  const validation = chatRequestSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse(
      'Invalid chat request parameters.',
      'VALIDATION_ERROR',
      400,
      validation.error.flatten()
    );
  }

  const { message, language, currentAqi, cityName } = validation.data;

  try {
    const stream = await streamAirWiseChat(message, currentAqi, cityName, language);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return errorResponse(
      'Failed to establish conversational stream.',
      'STREAM_ERROR',
      500,
      String(err)
    );
  }
}
