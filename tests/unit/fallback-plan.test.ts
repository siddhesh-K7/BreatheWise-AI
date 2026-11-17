import { describe, expect, it } from 'vitest';
import { generateDeterministicFallbackPlan } from '@/services/fallback-plan';
import { AqiReading, LocationQuery, QuantifiedImpact, UserProfile, WeatherContext } from '@/domain/types';

describe('Deterministic Fallback Plan Generator Unit Tests', () => {
  const loc: LocationQuery = { latitude: 28.61, longitude: 77.23, cityName: 'Delhi' };
  const prof: UserProfile = {
    hasChildren: true,
    hasElderly: true,
    respiratorySensitivity: true,
    commuteMode: 'car',
    dailyCommuteKm: 20,
    homeVentilation: 'standard',
    hasPurifier: false,
    cookingFuel: 'biomass-firewood',
    workSetting: 'hybrid',
  };
  const reading: AqiReading = {
    usAqi: 340,
    pm25: 220,
    pm10: 380,
    no2: 45,
    o3: 30,
    so2: 15,
    co: 900,
    category: 'hazardous',
    categoryLabel: 'Hazardous',
    timestamp: new Date().toISOString(),
    hourlyForecast: [],
  };
  const weather: WeatherContext = {
    temperatureC: 14,
    relativeHumidity: 80,
    windSpeedKmh: 3.5,
    boundaryLayerMeters: 180,
    isInversionActive: true,
    dispersionIndex: 0.17,
    smogRiskLevel: 'critical',
  };
  const impact: QuantifiedImpact = {
    pm25ReductionPercent: 65,
    pm25SavedMicrograms: 350,
    avoidedCigarettesPerDay: 7.5,
    avoidedCo2KgPerDay: 4.8,
  };

  it('generates a full schema-compliant deterministic plan in English', () => {
    const plan = generateDeterministicFallbackPlan(loc, prof, reading, weather, impact, 'en');

    expect(plan.isFallback).toBe(true);
    expect(plan.summary).toContain('Delhi');
    expect(plan.dailyRoutines.length).toBeGreaterThanOrEqual(3);
    expect(plan.indoorHacks.length).toBeGreaterThanOrEqual(3);
    expect(plan.sustainableAlternatives.length).toBeGreaterThanOrEqual(3);
    expect(plan.healthGuidance.length).toBeGreaterThanOrEqual(2);
    expect(plan.winterSmogAdvisory.diwaliStubbleAlert).toBeDefined();
  });

  it('generates localized fallback plans for Tamil and Hindi', () => {
    const planTa = generateDeterministicFallbackPlan(loc, prof, reading, weather, impact, 'ta');
    expect(planTa.summary).toContain('பகுதியில்');

    const planHi = generateDeterministicFallbackPlan(loc, prof, reading, weather, impact, 'hi');
    expect(planHi.summary).toContain('में');
  });

  it('guarantees indoor hacks cover all three cost tiers (free, under_inr_500, over_inr_500)', () => {
    const plan = generateDeterministicFallbackPlan(loc, prof, reading, weather, impact, 'en');
    const tiers = plan.indoorHacks.map((h) => h.costTier);

    expect(tiers).toContain('free');
    expect(tiers).toContain('under_inr_500');
    expect(tiers).toContain('over_inr_500');
  });
});
