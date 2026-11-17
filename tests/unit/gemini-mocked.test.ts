import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AqiReading, LocationQuery, QuantifiedImpact, UserProfile, WeatherContext } from '@/domain/types';

const mockAiPayload = {
  summary: 'Custom Gemini Action Plan for Northern Plains',
  dailyRoutines: [
    {
      timeBlock: '06:00-09:00',
      action: 'Indoor breathing exercises',
      rationale: 'Thermal smog inversion peak',
      emissionReduction: 'Zero exposure',
      targetAqiCondition: 'Critical Inversion',
    },
    {
      timeBlock: '13:00-15:00',
      action: 'Solar dispersion commute',
      rationale: 'Atmosphere mixed',
      emissionReduction: '30% drop',
      targetAqiCondition: 'Dispersion Window',
    },
  ],
  indoorHacks: [
    {
      title: 'Microfiber sealing',
      description: 'Damp towel gaps',
      costTier: 'free',
      costLabel: 'Free',
      expectedReductionPercent: 20,
    },
    {
      title: 'Corsi Rosenthal Box Fan',
      description: 'MERV13 box fan',
      costTier: 'under_inr_500',
      costLabel: 'Under ₹500',
      expectedReductionPercent: 65,
    },
    {
      title: 'True HEPA Clean Air System',
      description: 'High CADR purifier',
      costTier: 'over_inr_500',
      costLabel: 'Over ₹500',
      expectedReductionPercent: 80,
    },
  ],
  sustainableAlternatives: [
    {
      category: 'commute',
      currentPractice: 'Solo Petrol Sedan',
      sustainableChoice: 'Electric Metro Rail',
      co2Impact: '2.84 kg CO2 / day',
    },
    {
      category: 'cooking',
      currentPractice: 'Solid biomass',
      sustainableChoice: 'Induction Cooktop',
      co2Impact: 'Eliminates indoor soot',
    },
  ],
  healthGuidance: [
    {
      group: 'infants_children',
      advisory: 'Strict indoor play in HEPA filtered rooms',
      criticalRestrictions: ['Cancel morning school athletics'],
    },
    {
      group: 'elderly_sensitive',
      advisory: 'Cardiorespiratory monitoring and N95 masking',
      criticalRestrictions: ['Zero unmasked outdoor exposure'],
    },
  ],
  winterSmogAdvisory: {
    diwaliStubbleAlert: 'Stubble burning plume alert active',
    inversionGuidance: 'Surface boundary layer height compressed to 200m',
    peakHoursWarning: 'Diurnal crests between 06:00-10:00 and 18:00-22:00',
  },
};

let callCount = 0;
let lastPrompt = '';
let customGetGenerativeModel: ((opts: any) => any) | null = null;

const mockModelInstance = {
  generateContent: async (prompt: string) => {
    lastPrompt = prompt;
    callCount++;
    if (callCount === 1) {
      // Attempt 1: return malformed string to exercise 1-shot retry branch
      return { response: { text: () => 'invalid-json{' } };
    }
    return { response: { text: () => JSON.stringify(mockAiPayload) } };
  },
  generateContentStream: async () => ({
    stream: [
      { text: () => 'AirWise ' },
      { text: () => 'live answer from Gemini' },
    ],
  }),
};

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel(opts: any) {
        if (customGetGenerativeModel) {
          return customGetGenerativeModel(opts);
        }
        return mockModelInstance;
      }
    },
  };
});

describe('Gemini Service Mocked Model Tests', () => {
  const mockLocation: LocationQuery = { latitude: 28.61, longitude: 77.23, cityName: 'AI Test City' };
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

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'mock-key';
    customGetGenerativeModel = null;
    callCount = 0;
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    customGetGenerativeModel = null;
  });

  it('retries on attempt 1 failure and generates plan on attempt 2', async () => {
    const { generateStructuredPlan, streamAirWiseChat } = await import('@/services/gemini-service');

    const plan = await generateStructuredPlan(
      mockLocation,
      mockProfile,
      mockReading,
      mockWeather,
      mockImpact,
      'en'
    );

    expect(plan.isFallback).toBe(false);
    expect(plan.summary).toContain('Custom Gemini Action Plan');

    const stream = await streamAirWiseChat('Hello AI', 200, 'Delhi', 'en');
    const reader = stream.getReader();
    let text = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      text += new TextDecoder().decode(value);
    }
    expect(text).toContain('live answer from Gemini');
  });

  it('incorporates station cross-check and fire telemetry into Gemini prompt context', async () => {
    const { generateStructuredPlan } = await import('@/services/gemini-service');

    const mockFire = {
      isAvailable: true,
      count24h: 350,
      count72h: 1200,
      radiusKm: 500,
      isSeasonalBaseline: false,
      advisoryText: 'Active fires',
    };

    const mockCrossCheck = {
      modelAqi: 220,
      stationReading: {
        isAvailable: true,
        stationName: 'Anand Vihar CPCB',
        stationAqi: 295,
        dominantPollutant: 'PM2.5',
        timestamp: new Date().toISOString(),
        distanceKm: 8.5,
      },
      disagreementDetected: true,
      deviation: 75,
      effectiveSafetyAqi: 295,
    };

    // Use unique coordinates to bypass cache
    const testLocation = { ...mockLocation, latitude: 29.11, longitude: 77.88 };

    const plan1 = await generateStructuredPlan(
      testLocation,
      mockProfile,
      mockReading,
      mockWeather,
      mockImpact,
      'en',
      mockFire,
      mockCrossCheck
    );

    expect(lastPrompt).toContain('Ground Station Cross-Check');
    expect(lastPrompt).toContain('Anand Vihar CPCB');
    expect(lastPrompt).toContain('DISAGREEMENT DETECTED');
    expect(lastPrompt).toContain('safety AQI 295');
    expect(lastPrompt).toContain('Regional Active Fires (500km)');

    // Second call with same coordinates and profile should hit plan cache
    const plan2 = await generateStructuredPlan(
      testLocation,
      mockProfile,
      mockReading,
      mockWeather,
      mockImpact,
      'en',
      mockFire,
      mockCrossCheck
    );
    expect(plan2).toBe(plan1);
  });

  it('formats prompt gracefully when fire and station telemetry are omitted or agreed', async () => {
    const { generateStructuredPlan } = await import('@/services/gemini-service');
    const uniqueLoc = { ...mockLocation, latitude: 30.15, longitude: 76.54 };

    await generateStructuredPlan(
      uniqueLoc,
      mockProfile,
      mockReading,
      mockWeather,
      mockImpact,
      'hi'
    );
    expect(lastPrompt).toContain('Regional Fires: Seasonal agricultural burning season');
    expect(lastPrompt).toContain('Ground station telemetry unconfigured');

    const agreedLoc = { ...mockLocation, latitude: 30.15, longitude: 76.88 };
    await generateStructuredPlan(
      agreedLoc,
      mockProfile,
      mockReading,
      mockWeather,
      mockImpact,
      'ta',
      undefined,
      {
        modelAqi: 220,
        stationReading: { isAvailable: true, stationAqi: 225, timestamp: '' },
        disagreementDetected: false,
        deviation: 5,
        effectiveSafetyAqi: 220,
      }
    );
    expect(lastPrompt).toContain('[Model and Station agree]');
  });

  it('fails over to secondary model during plan generation if primary model throws', async () => {
    const { generateStructuredPlan } = await import('@/services/gemini-service');
    const failoverLoc = { ...mockLocation, latitude: 31.25, longitude: 75.33 };

    customGetGenerativeModel = (opts: { model: string }) => {
      if (opts.model === 'gemini-3.1-flash-lite') {
        throw new Error('Primary model 503 Overloaded');
      }
      return {
        generateContent: async () => ({
          response: { text: () => JSON.stringify(mockAiPayload) },
        }),
      };
    };

    const plan = await generateStructuredPlan(
      failoverLoc,
      mockProfile,
      mockReading,
      mockWeather,
      mockImpact,
      'en'
    );
    expect(plan.isFallback).toBe(false);
    expect(plan.summary).toContain('Custom Gemini Action Plan');
  });

  it('falls back to deterministic plan when all candidate models fail', async () => {
    const { generateStructuredPlan } = await import('@/services/gemini-service');
    const allFailLoc = { ...mockLocation, latitude: 32.45, longitude: 74.88 };

    customGetGenerativeModel = () => {
      throw new Error('Total outage on all models');
    };

    const plan = await generateStructuredPlan(
      allFailLoc,
      mockProfile,
      mockReading,
      mockWeather,
      mockImpact,
      'en'
    );
    expect(plan.isFallback).toBe(true);
    expect(plan.summary).toBeDefined();
  });

  it('fails over to secondary model during streaming chat when primary model throws', async () => {
    const { streamAirWiseChat } = await import('@/services/gemini-service');

    customGetGenerativeModel = (opts: { model: string }) => {
      if (opts.model === 'gemini-3.1-flash-lite') {
        throw new Error('Busy');
      }
      return {
        generateContentStream: async () => ({
          stream: [
            { text: () => '' },
            { text: () => 'Stream from failover model' },
          ],
        }),
      };
    };

    const stream = await streamAirWiseChat('Hello failover', 190, 'Jaipur', 'en');
    const reader = stream.getReader();
    let text = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      text += new TextDecoder().decode(value);
    }
    expect(text).toContain('Stream from failover model');
  });

  it('falls back to static stream advisory when all candidate models throw in streamAirWiseChat', async () => {
    const { streamAirWiseChat } = await import('@/services/gemini-service');

    customGetGenerativeModel = () => {
      throw new Error('All models 429 quota exhausted');
    };

    const stream = await streamAirWiseChat('Hello outage', undefined, undefined, 'en');
    const reader = stream.getReader();
    let text = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      text += new TextDecoder().decode(value);
    }
    expect(text).toContain('AirWise Advisory:');
    expect(text).toContain('minimize outdoor exposure');
  });

  it('handles stream iteration exception gracefully with note appended', async () => {
    const { streamAirWiseChat } = await import('@/services/gemini-service');

    customGetGenerativeModel = () => ({
      generateContentStream: async () => ({
        stream: (async function* () {
          yield { text: () => 'Initial chunk ' };
          throw new Error('Network socket terminated');
        })(),
      }),
    });

    const stream = await streamAirWiseChat('Crash midstream');
    const reader = stream.getReader();
    let text = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      text += new TextDecoder().decode(value);
    }
    expect(text).toContain('Initial chunk');
    expect(text).toContain('[Stream completed with note: Error: Network socket terminated]');
  });
});
