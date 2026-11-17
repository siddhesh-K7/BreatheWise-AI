import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateStructuredPlan, streamAirWiseChat } from '@/services/gemini-service';
import { AqiReading, LocationQuery, QuantifiedImpact, UserProfile, WeatherContext } from '@/domain/types';

describe('Gemini Service Fallback & Offline Resilience Tests', () => {
  const mockLocation: LocationQuery = { latitude: 28.61, longitude: 77.23, cityName: 'Delhi' };
  const mockProfile: UserProfile = {
    hasChildren: true,
    hasElderly: false,
    respiratorySensitivity: false,
    commuteMode: 'car',
    dailyCommuteKm: 20,
    homeVentilation: 'standard',
    hasPurifier: false,
    cookingFuel: 'lpg-induction',
    workSetting: 'hybrid',
  };
  const mockReading: AqiReading = {
    usAqi: 220,
    pm25: 140,
    pm10: 250,
    no2: 40,
    o3: 30,
    so2: 15,
    co: 800,
    category: 'very-unhealthy',
    categoryLabel: 'Very Unhealthy',
    timestamp: new Date().toISOString(),
    hourlyForecast: [],
  };
  const mockWeather: WeatherContext = {
    temperatureC: 15,
    relativeHumidity: 75,
    windSpeedKmh: 4.0,
    boundaryLayerMeters: 200,
    isInversionActive: true,
    dispersionIndex: 0.22,
    smogRiskLevel: 'critical',
  };
  const mockImpact: QuantifiedImpact = {
    pm25ReductionPercent: 40,
    pm25SavedMicrograms: 180,
    avoidedCigarettesPerDay: 3.2,
    avoidedCo2KgPerDay: 2.8,
  };

  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    vi.restoreAllMocks();
  });

  it('gracefully generates deterministic fallback plan when GEMINI_API_KEY is not set', async () => {
    const plan = await generateStructuredPlan(
      mockLocation,
      mockProfile,
      mockReading,
      mockWeather,
      mockImpact,
      'en'
    );

    expect(plan.isFallback).toBe(true);
    expect(plan.summary).toContain('Delhi');
    expect(plan.dailyRoutines.length).toBeGreaterThanOrEqual(3);
  });

  it('provides safe offline fallback stream when GEMINI_API_KEY is missing for chat', async () => {
    const stream = await streamAirWiseChat('How to protect against smog?', 220, 'Delhi', 'en');
    const reader = stream.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);

    expect(text).toContain('offline mode');
  });
});
