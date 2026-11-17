/**
 * @fileoverview Standardized API response serializer and centralized error handler.
 * Enforces a consistent envelope contract across all serverless endpoints.
 */

import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

/**
 * Returns a standardized JSON success response.
 */
export function successResponse<T>(data: T, status: number = 200) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status });
}

/**
 * Returns a standardized JSON error response.
 */
export function errorResponse(message: string, code: string = 'BAD_REQUEST', status: number = 400, details?: unknown) {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status });
}
