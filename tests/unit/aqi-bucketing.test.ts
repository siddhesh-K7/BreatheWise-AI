import { describe, expect, it, vi } from 'vitest';
import { classifyAqi, evaluateSmogInversion, fetchAirQualityAndWeather } from '@/services/aqi-service';

describe('AQI Classification & Smog Inversion Unit Tests', () => {
  it('correctly classifies all standard US AQI boundaries', () => {
    expect(classifyAqi(25).category).toBe('good');
    expect(classifyAqi(50).category).toBe('good');
    expect(classifyAqi(51).category).toBe('moderate');
    expect(classifyAqi(100).category).toBe('moderate');
    expect(classifyAqi(101).category).toBe('unhealthy-sensitive');
    expect(classifyAqi(150).category).toBe('unhealthy-sensitive');
    expect(classifyAqi(151).category).toBe('unhealthy');
    expect(classifyAqi(200).category).toBe('unhealthy');
    expect(classifyAqi(201).category).toBe('very-unhealthy');
    expect(classifyAqi(300).category).toBe('very-unhealthy');
    expect(classifyAqi(301).category).toBe('hazardous');
    expect(classifyAqi(500).category).toBe('hazardous');
  });

  it('detects active atmospheric temperature inversion below 250m with calm wind (<= 5 km/h)', () => {
    const critical1 = evaluateSmogInversion(3.5, 180, 310);
    expect(critical1.isInversionActive).toBe(true);
    expect(critical1.smogRiskLevel).toBe('critical');

    const critical2 = evaluateSmogInversion(4.0, 200, 160);
    expect(critical2.isInversionActive).toBe(true);
    expect(critical2.smogRiskLevel).toBe('critical');

    const severe1 = evaluateSmogInversion(8.0, 300, 220);
    expect(severe1.isInversionActive).toBe(false);
    expect(severe1.smogRiskLevel).toBe('severe');

    const severe2 = evaluateSmogInversion(3.0, 200, 80);
    expect(severe2.isInversionActive).toBe(true);
    expect(severe2.smogRiskLevel).toBe('severe');

    const moderate = evaluateSmogInversion(10.0, 400, 110);
    expect(moderate.isInversionActive).toBe(false);
    expect(moderate.smogRiskLevel).toBe('moderate');

    const low = evaluateSmogInversion(15.0, 850, 45);
    expect(low.isInversionActive).toBe(false);
    expect(low.smogRiskLevel).toBe('low');
  });

  it('throws an error when upstream Open-Meteo returns non-200 HTTP status', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('Error', { status: 500 }));

    await expect(fetchAirQualityAndWeather(19.07, 72.87)).rejects.toThrow(
      'Open-Meteo API returned status 500'
    );
  });
});
