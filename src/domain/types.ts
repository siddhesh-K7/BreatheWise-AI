/**
 * @fileoverview Pure TypeScript domain models and interface contracts for AirWise.
 * Establishes strict type invariants without external runtime dependencies.
 */

/**
 * Supported localization languages across client and AI responses.
 */
export type SupportedLanguage = 'en' | 'ta' | 'hi';

/**
 * Categorical health risk tier conforming to US EPA and Indian CPCB standards.
 */
export type AqiCategory =
  'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';

/**
 * Hourly particulate matter and AQI sample point.
 */
export interface HourlyAqiSample {
  time: string;
  pm25: number;
  usAqi: number;
}

/**
 * Real-time comprehensive air quality telemetry reading.
 */
export interface AqiReading {
  usAqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  so2: number;
  co: number;
  category: AqiCategory;
  categoryLabel: string;
  timestamp: string;
  hourlyForecast: HourlyAqiSample[];
}

/**
 * Meteorological boundary context derived from Open-Meteo weather telemetry.
 */
export interface WeatherContext {
  temperatureC: number;
  relativeHumidity: number;
  windSpeedKmh: number;
  boundaryLayerMeters: number;
  isInversionActive: boolean;
  dispersionIndex: number;
  smogRiskLevel: 'low' | 'moderate' | 'severe' | 'critical';
}

/**
 * Lifestyle, demographic, and housing attributes of the evaluating household.
 */
export interface UserProfile {
  hasChildren: boolean;
  hasElderly: boolean;
  respiratorySensitivity: boolean;
  commuteMode: 'metro' | 'bus' | 'car' | 'two-wheeler' | 'active' | 'wfh';
  dailyCommuteKm: number;
  homeVentilation: 'tight-sealed' | 'standard' | 'high-leakage';
  hasPurifier: boolean;
  cookingFuel: 'lpg-induction' | 'biomass-firewood' | 'mixed';
  workSetting: 'remote' | 'hybrid' | 'onsite';
}

/**
 * Deterministically computed exposure and emission reduction figures.
 */
export interface QuantifiedImpact {
  pm25ReductionPercent: number;
  pm25SavedMicrograms: number;
  avoidedCigarettesPerDay: number;
  avoidedCo2KgPerDay: number;
}

/**
 * Chronological routine suggestion mapped to hourly smog curves.
 */
export interface RoutineItem {
  timeBlock: string;
  action: string;
  rationale: string;
  emissionReduction: string;
  targetAqiCondition: string;
}

/**
 * Tiered indoor air quality optimization tactic.
 */
export interface IndoorHack {
  title: string;
  description: string;
  costTier: 'free' | 'under_inr_500' | 'over_inr_500';
  costLabel: string;
  expectedReductionPercent: number;
}

/**
 * Habit or resource substitution aimed at suppressing systemic urban emissions.
 */
export interface SustainableAlternative {
  category: 'commute' | 'cooking' | 'waste' | 'energy';
  currentPractice: string;
  sustainableChoice: string;
  co2Impact: string;
}

/**
 * Vulnerability-tailored medical and physical exertion advisory.
 */
export interface AgeGroupGuidance {
  group: 'infants_children' | 'adults' | 'elderly_sensitive';
  advisory: string;
  criticalRestrictions: string[];
}

/**
 * Comprehensive GenAI-composed action plan verified against schema standards.
 */
export interface AirWisePlan {
  summary: string;
  dailyRoutines: RoutineItem[];
  indoorHacks: IndoorHack[];
  sustainableAlternatives: SustainableAlternative[];
  healthGuidance: AgeGroupGuidance[];
  quantifiedImpact: QuantifiedImpact;
  winterSmogAdvisory: {
    diwaliStubbleAlert: string;
    inversionGuidance: string;
    peakHoursWarning: string;
  };
  isFallback: boolean;
  generatedAt: string;
}

/**
 * Spatial coordinate location descriptor.
 */
export interface LocationQuery {
  latitude: number;
  longitude: number;
  cityName: string;
  stateName?: string;
}

/**
 * Result returned by Open-Meteo geocoding search.
 */
export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  admin1?: string;
}

/**
 * Physical ground monitoring station reading from WAQI/aqicn.
 */
export interface WaqiStationReading {
  isAvailable: boolean;
  stationName?: string;
  stationAqi?: number;
  dominantPollutant?: string;
  timestamp?: string;
  distanceKm?: number;
  statusReason?: string;
}

/**
 * Comparative telemetry analysis between gridded atmospheric model and ground station.
 */
export interface AqiCrossCheck {
  modelAqi: number;
  stationReading: WaqiStationReading;
  disagreementDetected: boolean;
  deviation: number;
  effectiveSafetyAqi: number;
}

/**
 * Active thermal anomaly / fire detection summary from NASA FIRMS telemetry.
 */
export interface FirmsFireSummary {
  isAvailable: boolean;
  count24h: number;
  count72h: number;
  radiusKm: number;
  isSeasonalBaseline: boolean;
  advisoryText: string;
}
