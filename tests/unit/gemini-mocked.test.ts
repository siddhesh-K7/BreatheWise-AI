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
      getGenerativeModel() {
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
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
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

    await generateStructuredPlan(
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
  });
});
