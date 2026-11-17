/**
 * @fileoverview Immutable system constants, thresholds, and domain presets for AirWise.
 * Enforces a single source of truth to eliminate magic numbers and ensure system-wide type safety.
 */

/**
 * Standardized US AQI category threshold boundaries based on EPA/CPCB standards.
 */
export const AQI_THRESHOLDS = {
  GOOD_MAX: 50,
  MODERATE_MAX: 100,
  UNHEALTHY_SENSITIVE_MAX: 150,
  UNHEALTHY_MAX: 200,
  VERY_UNHEALTHY_MAX: 300,
  HAZARDOUS_MIN: 301,
} as const;

/**
 * Berkeley Earth standard: 22 micrograms/m^3 of 24h PM2.5 exposure equals roughly 1 cigarette.
 * @see Muller & Muller (2015)
 */
export const BERKELEY_EARTH_PM25_PER_CIGARETTE = 22.0;

/**
 * Breathing volume constants normalized by activity level in cubic meters per hour.
 */
export const BREATHING_RATES_M3_PER_HOUR = {
  SEDENTARY_INDOOR: 0.5,
  MODERATE_COMMUTE: 1.2,
  STRENUOUS_OUTDOOR: 2.4,
} as const;

/**
 * Fractional filtration and mitigation efficiencies (0.0 to 1.0).
 */
export const INTERVENTION_EFFICIENCIES = {
  TRUE_HEPA_PURIFIER: 0.8,
  DIY_BOX_FAN_MERV13: 0.65,
  CERTIFIED_N95_MASK: 0.85,
  OFF_PEAK_COMMUTE_SHIFT: 0.4,
  WET_MOPPING_SEALING: 0.2,
} as const;

/**
 * Urban transit emission factors in grams of CO2 per passenger-kilometer.
 * Sourced from India GHG Programme & Central Pollution Control Board (CPCB).
 */
export const TRANSIT_EMISSION_FACTORS = {
  PETROL_CAR_SOLO: 160.0,
  TWO_WHEELER_PETROL: 55.0,
  CARPOOL_SHARED: 53.0,
  ELECTRIC_METRO: 18.0,
  ELECTRIC_BUS: 25.0,
  BICYCLE_WALKING: 0.0,
} as const;

/**
 * Winter meteorological thresholds for severe atmospheric inversion.
 */
export const WINTER_INVERSION_THRESHOLDS = {
  CRITICAL_BOUNDARY_LAYER_METERS: 250,
  STAGNANT_WIND_SPEED_KMH: 5.0,
  PEAK_SMOG_START_HOUR: 6,
  PEAK_SMOG_END_HOUR: 10,
  EVENING_SMOG_START_HOUR: 18,
  EVENING_SMOG_END_HOUR: 22,
} as const;

/**
 * Pre-configured metropolitan presets for zero-friction evaluation.
 */
export const METRO_PRESETS = [
  {
    id: 'delhi',
    cityName: 'Delhi NCR',
    state: 'Delhi',
    latitude: 28.61,
    longitude: 77.23,
    description: 'Northern plains inversion hotspot with severe winter smog and stubble smoke.',
  },
  {
    id: 'chennai',
    cityName: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.08,
    longitude: 80.27,
    description: 'Coastal peninsula basin with marine boundary effects and transit corridors.',
  },
  {
    id: 'lucknow',
    cityName: 'Lucknow',
    state: 'Uttar Pradesh',
    latitude: 26.85,
    longitude: 80.95,
    description: 'Gangetic belt urban basin prone to dense fog and high PM2.5 entrapment.',
  },
  {
    id: 'kolkata',
    cityName: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.57,
    longitude: 88.36,
    description: 'Eastern delta metropolitan basin experiencing winter night-time inversions.',
  },
] as const;

/**
 * Network caching TTLs in milliseconds.
 */
export const CACHE_TTL_MS = {
  AQI_DATA: 15 * 60 * 1000, // 15 minutes
  RECOMMENDATIONS: 30 * 60 * 1000, // 30 minutes
  GEOCODING: 60 * 60 * 1000, // 1 hour TTL per specification
} as const;

/**
 * API rate limits per client IP identifier.
 */
export const RATE_LIMITS = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS_GENERAL: 60,
  MAX_REQUESTS_GEMINI: 20,
} as const;

/**
 * Token budget limits for serverless Gemini operations to maximize efficiency.
 */
export const GEMINI_TOKEN_BUDGETS = {
  STRUCTURED_PLAN: 1200,
  STREAMING_CHAT: 600,
} as const;
