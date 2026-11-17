/**
 * @fileoverview Zod runtime validation schemas and prompt sanitization utilities.
 * Enforces boundary security, parameter ranges, and injection resistance.
 */

import { z } from 'zod';

/**
 * Coordinate and geographic location validation schema.
 * Rejects out-of-range latitude/longitude coordinates to protect third-party endpoints.
 */
export const locationQuerySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  cityName: z.string().trim().min(1).max(100),
  stateName: z.string().trim().max(100).optional(),
});

/**
 * Household lifestyle, demographic, and housing parameter schema.
 */
export const userProfileSchema = z.object({
  hasChildren: z.boolean(),
  hasElderly: z.boolean(),
  respiratorySensitivity: z.boolean(),
  commuteMode: z.enum(['metro', 'bus', 'car', 'two-wheeler', 'active', 'wfh']),
  dailyCommuteKm: z.number().min(0).max(300),
  homeVentilation: z.enum(['tight-sealed', 'standard', 'high-leakage']),
  hasPurifier: z.boolean(),
  cookingFuel: z.enum(['lpg-induction', 'biomass-firewood', 'mixed']),
  workSetting: z.enum(['remote', 'hybrid', 'onsite']),
});

/**
 * Inbound payload schema for plan generation requests.
 */
export const planRequestSchema = z.object({
  location: locationQuerySchema,
  profile: userProfileSchema,
  language: z.enum(['en', 'ta', 'hi']).default('en'),
});

/**
 * Inbound payload schema for conversational AI chat requests.
 */
export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  language: z.enum(['en', 'ta', 'hi']).default('en'),
  currentAqi: z.number().min(0).max(2000).optional(),
  currentPm25: z.number().min(0).max(2000).optional(),
  cityName: z.string().trim().max(100).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().max(2000),
      })
    )
    .max(10)
    .optional(),
});

/**
 * Schema validating Gemini structured JSON recommendations output.
 */
export const structuredPlanOutputSchema = z.object({
  summary: z.string().min(10).max(1000),
  dailyRoutines: z
    .array(
      z.object({
        timeBlock: z.string(),
        action: z.string(),
        rationale: z.string(),
        emissionReduction: z.string(),
        targetAqiCondition: z.string(),
      })
    )
    .min(2),
  indoorHacks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        costTier: z.enum(['free', 'under_inr_500', 'over_inr_500']),
        costLabel: z.string(),
        expectedReductionPercent: z.number().min(0).max(100),
      })
    )
    .min(3),
  sustainableAlternatives: z
    .array(
      z.object({
        category: z.enum(['commute', 'cooking', 'waste', 'energy']),
        currentPractice: stringOrFallback(),
        sustainableChoice: z.string(),
        co2Impact: z.string(),
      })
    )
    .min(2),
  healthGuidance: z
    .array(
      z.object({
        group: z.enum(['infants_children', 'adults', 'elderly_sensitive']),
        advisory: z.string(),
        criticalRestrictions: z.array(z.string()),
      })
    )
    .min(2),
  winterSmogAdvisory: z.object({
    diwaliStubbleAlert: z.string(),
    inversionGuidance: z.string(),
    peakHoursWarning: z.string(),
  }),
});

/**
 * Helper generating resilient fallback string validation.
 */
function stringOrFallback() {
  return z.string().default('Conventional urban lifestyle');
}

/**
 * Sanitizes user input against prompt injection patterns and delimiters.
 * @param input Raw unsanitized text from client
 * @returns Cleaned, delimiter-safe string
 */
export function sanitizeUserPrompt(input: string): string {
  return input
    .replace(/<\/?[^>]+(>|$)/g, '') // Strip HTML/XML tags
    .replace(
      /\b(ignore previous instructions|system instruction|override prompt)\b/gi,
      '[filtered]'
    )
    .replace(/[`${}]/g, '') // Strip interpolation markers
    .trim()
    .slice(0, 2000);
}
