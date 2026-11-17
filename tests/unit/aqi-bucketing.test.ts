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

  it('parses fallback defaults when Open-Meteo returns empty payloads and caches results', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({}), { status: 200 });
    });

    const result1 = await fetchAirQualityAndWeather(26.85, 80.95);
    expect(result1.reading.usAqi).toBe(150);
    expect(result1.reading.pm25).toBe(60);
    expect(result1.reading.pm10).toBe(110);
    expect(result1.reading.hourlyForecast).toEqual([]);
    expect(result1.weather.temperatureC).toBe(18);
    expect(result1.weather.relativeHumidity).toBe(65);
    expect(result1.weather.boundaryLayerMeters).toBe(350);

    // Second call for same quantized coordinates should hit cache
    const result2 = await fetchAirQualityAndWeather(26.85, 80.95);
    expect(result2).toBe(result1);

    fetchSpy.mockRestore();
  });

  it('parses hourly array fallback values when hourly items have undefined entries', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const u = String(url);
      if (u.includes('air-quality')) {
        return new Response(
          JSON.stringify({
            current: { us_aqi: 160 },
            hourly: {
              time: [undefined as unknown as string],
              pm2_5: [undefined as unknown as number],
              us_aqi: [undefined as unknown as number],
            },
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ current: {}, hourly: {} }), { status: 200 });
    });

    const result = await fetchAirQualityAndWeather(13.08, 80.27);
    expect(result.reading.hourlyForecast.length).toBe(1);
    expect(result.reading.hourlyForecast[0].time).toBe('0:00');
    expect(result.reading.hourlyForecast[0].pm25).toBe(50);
    expect(result.reading.hourlyForecast[0].usAqi).toBe(160);

    fetchSpy.mockRestore();
  });

  it('clamps and classifies negative or zero AQI gracefully', () => {
    expect(classifyAqi(0).category).toBe('good');
    expect(classifyAqi(-10).category).toBe('good');
  });

  it('evaluates dispersion index across wind and boundary layer extremes', () => {
    // Zero wind speed with very shallow boundary layer
    const stagnant = evaluateSmogInversion(0, 50, 450);
    expect(stagnant.dispersionIndex).toBeLessThan(0.1);
    expect(stagnant.isInversionActive).toBe(true);
    expect(stagnant.smogRiskLevel).toBe('critical');

    // High wind speed (> 25 km/h) with deep planetary boundary layer (> 1500m)
    const strongWind = evaluateSmogInversion(30, 2000, 35);
    expect(strongWind.dispersionIndex).toBeGreaterThan(0.8);
    expect(strongWind.isInversionActive).toBe(false);
    expect(strongWind.smogRiskLevel).toBe('low');
  });
});
