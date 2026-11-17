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
 * Autocomplete search query validation schema.
 */
export const geocodingQuerySchema = z.object({
  name: z.string().trim().min(2).max(100),
  count: z.coerce.number().min(1).max(10).default(5),
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
 * Features resilient normalization for categorical enums and data types.
 */
export const structuredPlanOutputSchema = z.object({
  summary: z.string().min(5).max(1000),
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
    .min(1),
  indoorHacks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        costTier: z.preprocess((val) => {
          if (typeof val === 'string') {
            const v = val.toLowerCase().replace(/[\s-]/g, '_');
            if (v.includes('free') || v.includes('zero') || v.includes('0')) return 'free';
            if (v.includes('over') || v.includes('high') || v.includes('tier3')) return 'over_inr_500';
            if (v.includes('under') || v.includes('low') || v.includes('500') || v.includes('tier2')) return 'under_inr_500';
          }
          return 'free';
        }, z.enum(['free', 'under_inr_500', 'over_inr_500'])),
        costLabel: z.preprocess(
          (val) => (typeof val === 'string' && val.length > 0 ? val : 'INR 0'),
          z.string()
        ),
        expectedReductionPercent: z.coerce.number().min(0).max(100).default(20),
      })
    )
    .min(1),
  sustainableAlternatives: z
    .array(
      z.object({
        category: z.preprocess((val) => {
          if (typeof val === 'string') {
            const v = val.toLowerCase();
            if (v === 'transport' || v === 'transit') return 'commute';
            if (['commute', 'cooking', 'waste', 'energy'].includes(v)) return v;
          }
          return 'commute';
        }, z.enum(['commute', 'cooking', 'waste', 'energy'])),
        currentPractice: stringOrFallback(),
        sustainableChoice: z.string(),
        co2Impact: z.string(),
      })
    )
    .min(1),
  healthGuidance: z
    .array(
      z.object({
        group: z.preprocess((val) => {
          if (typeof val === 'string') {
            const v = val.toLowerCase();
            if (v.includes('child') || v.includes('infant')) return 'infants_children';
            if (v.includes('elder') || v.includes('sensitiv') || v.includes('vulnerab')) return 'elderly_sensitive';
            if (v.includes('adult')) return 'adults';
          }
          return 'adults';
        }, z.enum(['infants_children', 'adults', 'elderly_sensitive'])),
        advisory: z.string(),
        criticalRestrictions: z.preprocess((val) => {
          if (Array.isArray(val)) return val.map(String);
          if (typeof val === 'string') return [val];
          return ['Minimize outdoor exertion during peak smog intervals'];
        }, z.array(z.string())),
      })
    )
    .min(1),
  winterSmogAdvisory: z
    .object({
      diwaliStubbleAlert: z
        .string()
        .default('Regional agricultural stubble emissions elevated. Keep windows sealed during morning inversions.'),
      inversionGuidance: z
        .string()
        .default('Nighttime atmospheric inversion traps surface pollutants near ground level until early afternoon.'),
      peakHoursWarning: z
        .string()
        .default('Peak particulate concentration occurs between 06:00-09:30 and 18:30-22:00. Reschedule outdoor activities.'),
    })
    .default({
      diwaliStubbleAlert: 'Regional agricultural stubble emissions elevated. Keep windows sealed during morning inversions.',
      inversionGuidance: 'Nighttime atmospheric inversion traps surface pollutants near ground level until early afternoon.',
      peakHoursWarning: 'Peak particulate concentration occurs between 06:00-09:30 and 18:30-22:00. Reschedule outdoor activities.',
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
