/**
 * @fileoverview System health and observability probe endpoint.
 * Evaluates service availability, process uptime, and edge execution status.
 */

import { successResponse } from '@/services/api-response';

/**
 * Handles GET health probe checks.
 */
export async function GET() {
  return successResponse({
    status: 'healthy',
    version: '1.0.0',
    service: 'AirWise Urban Air Quality Assistant',
    uptimeSeconds: Number(process.uptime().toFixed(1)),
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
}
