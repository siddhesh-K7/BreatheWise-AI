import { describe, expect, it } from 'vitest';
import { TRANSLATIONS } from '@/config/translations';
import {
  AQI_THRESHOLDS,
  BERKELEY_EARTH_PM25_PER_CIGARETTE,
  CACHE_TTL_MS,
  GEMINI_TOKEN_BUDGETS,
  INTERVENTION_EFFICIENCIES,
  METRO_PRESETS,
  RATE_LIMITS,
  TRANSIT_EMISSION_FACTORS,
  WINTER_INVERSION_THRESHOLDS,
} from '@/config/constants';
import { SupportedLanguage } from '@/domain/types';

describe('Translations & Constants Configuration Unit Tests', () => {
  const supportedLanguages: SupportedLanguage[] = ['en', 'ta', 'hi'];

  describe('Localization integrity across English, Tamil, and Hindi', () => {
    it('defines dictionaries for all supported languages', () => {
      supportedLanguages.forEach((lang) => {
        expect(TRANSLATIONS[lang]).toBeDefined();
        expect(typeof TRANSLATIONS[lang]).toBe('object');
      });
    });

    it('ensures all translation keys in English exist in Tamil and Hindi', () => {
      const enKeys = Object.keys(TRANSLATIONS.en) as (keyof typeof TRANSLATIONS.en)[];
      expect(enKeys.length).toBeGreaterThan(20);

      supportedLanguages.forEach((lang) => {
        enKeys.forEach((key) => {
          expect(TRANSLATIONS[lang][key], `Missing translation for key: ${String(key)} in ${lang}`).toBeDefined();
          expect(typeof TRANSLATIONS[lang][key]).toBe('string');
          expect(TRANSLATIONS[lang][key].trim().length).toBeGreaterThan(0);
        });
      });
    });

    it('contains hazardous alert translations with action guidance in all 3 languages', () => {
      supportedLanguages.forEach((lang) => {
        expect(TRANSLATIONS[lang].hazardousAlertTitle.length).toBeGreaterThan(5);
        expect(TRANSLATIONS[lang].hazardousAlertBody.length).toBeGreaterThan(15);
      });
    });

    it('contains medical disclaimers in all 3 languages', () => {
      supportedLanguages.forEach((lang) => {
        expect(TRANSLATIONS[lang].medicalDisclaimerTitle.length).toBeGreaterThan(3);
        expect(TRANSLATIONS[lang].medicalDisclaimerBody.length).toBeGreaterThan(20);
      });
    });

    it('contains cost tier labels in all 3 languages', () => {
      supportedLanguages.forEach((lang) => {
        expect(TRANSLATIONS[lang].costFree.length).toBeGreaterThan(0);
        expect(TRANSLATIONS[lang].costUnder500.length).toBeGreaterThan(0);
        expect(TRANSLATIONS[lang].costOver500.length).toBeGreaterThan(0);
      });
    });
  });

  describe('System Constants & Environmental Benchmarks', () => {
    it('verifies Berkeley Earth cigarette equivalence standard (22 µg/m³)', () => {
      expect(BERKELEY_EARTH_PM25_PER_CIGARETTE).toBe(22.0);
    });

    it('verifies standard AQI threshold hierarchy strictly increases', () => {
      expect(AQI_THRESHOLDS.GOOD_MAX).toBeLessThan(AQI_THRESHOLDS.MODERATE_MAX);
      expect(AQI_THRESHOLDS.MODERATE_MAX).toBeLessThan(AQI_THRESHOLDS.UNHEALTHY_SENSITIVE_MAX);
      expect(AQI_THRESHOLDS.UNHEALTHY_SENSITIVE_MAX).toBeLessThan(AQI_THRESHOLDS.UNHEALTHY_MAX);
      expect(AQI_THRESHOLDS.UNHEALTHY_MAX).toBeLessThan(AQI_THRESHOLDS.VERY_UNHEALTHY_MAX);
      expect(AQI_THRESHOLDS.VERY_UNHEALTHY_MAX).toBeLessThan(AQI_THRESHOLDS.HAZARDOUS_MIN);
    });

    it('verifies all 4 demo metro presets (Delhi, Chennai, Lucknow, Kolkata)', () => {
      expect(METRO_PRESETS).toHaveLength(4);
      const cityIds = METRO_PRESETS.map((p) => p.id);
      expect(cityIds).toContain('delhi');
      expect(cityIds).toContain('chennai');
      expect(cityIds).toContain('lucknow');
      expect(cityIds).toContain('kolkata');

      METRO_PRESETS.forEach((preset) => {
        expect(preset.latitude).toBeGreaterThan(8);
        expect(preset.latitude).toBeLessThan(36);
        expect(preset.longitude).toBeGreaterThan(68);
        expect(preset.longitude).toBeLessThan(98);
        expect(preset.cityName.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(10);
      });
    });

    it('verifies intervention efficiencies lie strictly between 0 and 1', () => {
      Object.values(INTERVENTION_EFFICIENCIES).forEach((eff) => {
        expect(eff).toBeGreaterThan(0);
        expect(eff).toBeLessThanOrEqual(1);
      });
      // HEPA purifier is superior to wet mopping
      expect(INTERVENTION_EFFICIENCIES.TRUE_HEPA_PURIFIER).toBeGreaterThan(
        INTERVENTION_EFFICIENCIES.WET_MOPPING_SEALING
      );
    });

    it('verifies transit emission factors rank active/metro lower than solo petrol car', () => {
      expect(TRANSIT_EMISSION_FACTORS.BICYCLE_WALKING).toBe(0.0);
      expect(TRANSIT_EMISSION_FACTORS.ELECTRIC_METRO).toBeLessThan(
        TRANSIT_EMISSION_FACTORS.TWO_WHEELER_PETROL
      );
      expect(TRANSIT_EMISSION_FACTORS.TWO_WHEELER_PETROL).toBeLessThan(
        TRANSIT_EMISSION_FACTORS.PETROL_CAR_SOLO
      );
    });

    it('verifies winter inversion meteorology constants', () => {
      expect(WINTER_INVERSION_THRESHOLDS.CRITICAL_BOUNDARY_LAYER_METERS).toBe(250);
      expect(WINTER_INVERSION_THRESHOLDS.STAGNANT_WIND_SPEED_KMH).toBe(5.0);
      expect(WINTER_INVERSION_THRESHOLDS.PEAK_SMOG_START_HOUR).toBe(6);
      expect(WINTER_INVERSION_THRESHOLDS.PEAK_SMOG_END_HOUR).toBe(10);
      expect(WINTER_INVERSION_THRESHOLDS.EVENING_SMOG_START_HOUR).toBe(18);
      expect(WINTER_INVERSION_THRESHOLDS.EVENING_SMOG_END_HOUR).toBe(22);
    });

    it('verifies cache TTLs and rate limits', () => {
      expect(CACHE_TTL_MS.AQI_DATA).toBe(15 * 60 * 1000);
      expect(CACHE_TTL_MS.GEOCODING).toBe(60 * 60 * 1000);
      expect(RATE_LIMITS.WINDOW_MS).toBe(60 * 1000);
      expect(RATE_LIMITS.MAX_REQUESTS_GENERAL).toBeGreaterThan(0);
      expect(RATE_LIMITS.MAX_REQUESTS_GEMINI).toBeGreaterThan(0);
    });

    it('verifies Gemini token budgets prevent uncontrolled consumption', () => {
      expect(GEMINI_TOKEN_BUDGETS.STRUCTURED_PLAN).toBeGreaterThanOrEqual(1000);
      expect(GEMINI_TOKEN_BUDGETS.STREAMING_CHAT).toBeGreaterThanOrEqual(500);
    });
  });
});
