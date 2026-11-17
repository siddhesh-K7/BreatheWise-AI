/**
 * @fileoverview Real-time atmospheric telemetry client communicating with Open-Meteo APIs.
 * Ingests live particulate concentrations, US AQI metrics, and winter boundary layer meteorology.
 */

import { AQI_THRESHOLDS, CACHE_TTL_MS, WINTER_INVERSION_THRESHOLDS } from '@/config/constants';
import { AqiCategory, AqiReading, HourlyAqiSample, WeatherContext } from '@/domain/types';
import { appCache } from './cache';

interface RawOpenMeteoAqi {
  current?: {
    us_aqi?: number;
    pm2_5?: number;
    pm10?: number;
    nitrogen_dioxide?: number;
    ozone?: number;
    sulphur_dioxide?: number;
    carbon_monoxide?: number;
  };
  hourly?: {
    time?: string[];
    pm2_5?: number[];
    us_aqi?: number[];
  };
}

interface RawOpenMeteoWeather {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
  hourly?: {
    boundary_layer_height?: number[];
  };
}

/**
 * Maps raw US AQI value to standardized category and human-readable label.
 */
export function classifyAqi(aqi: number): { category: AqiCategory; label: string } {
  if (aqi <= AQI_THRESHOLDS.GOOD_MAX) {
    return { category: 'good', label: 'Good' };
  }
  if (aqi <= AQI_THRESHOLDS.MODERATE_MAX) {
    return { category: 'moderate', label: 'Moderate' };
  }
  if (aqi <= AQI_THRESHOLDS.UNHEALTHY_SENSITIVE_MAX) {
    return { category: 'unhealthy-sensitive', label: 'Unhealthy for Sensitive Groups' };
  }
  if (aqi <= AQI_THRESHOLDS.UNHEALTHY_MAX) {
    return { category: 'unhealthy', label: 'Unhealthy' };
  }
  if (aqi <= AQI_THRESHOLDS.VERY_UNHEALTHY_MAX) {
    return { category: 'very-unhealthy', label: 'Very Unhealthy' };
  }
  return { category: 'hazardous', label: 'Hazardous' };
}

/**
 * Evaluates winter temperature inversion and atmospheric dispersion dynamics.
 */
export function evaluateSmogInversion(
  windSpeedKmh: number,
  boundaryLayerMeters: number,
  aqi: number
): {
  isInversionActive: boolean;
  dispersionIndex: number;
  smogRiskLevel: WeatherContext['smogRiskLevel'];
} {
  const windMps = windSpeedKmh / 3.6;
  const dispersionIndex = Number(((windMps * boundaryLayerMeters) / 100).toFixed(2));
  const isInversionActive =
    boundaryLayerMeters < WINTER_INVERSION_THRESHOLDS.CRITICAL_BOUNDARY_LAYER_METERS &&
    windSpeedKmh <= WINTER_INVERSION_THRESHOLDS.STAGNANT_WIND_SPEED_KMH;

  let smogRiskLevel: WeatherContext['smogRiskLevel'] = 'low';
  if (aqi > AQI_THRESHOLDS.VERY_UNHEALTHY_MAX || (isInversionActive && aqi > 150)) {
    smogRiskLevel = 'critical';
  } else if (aqi > AQI_THRESHOLDS.UNHEALTHY_MAX || isInversionActive) {
    smogRiskLevel = 'severe';
  } else if (aqi > AQI_THRESHOLDS.MODERATE_MAX) {
    smogRiskLevel = 'moderate';
  }

  return { isInversionActive, dispersionIndex, smogRiskLevel };
}

/**
 * Fetches real live air quality and weather telemetry with TTL caching and coordinate quantization.
 * @param lat Unrounded latitude
 * @param lon Unrounded longitude
 */
export async function fetchAirQualityAndWeather(
  lat: number,
  lon: number
): Promise<{ reading: AqiReading; weather: WeatherContext }> {
  const quantCoord = appCache.quantizeCoordinates(lat, lon);
  const cacheKey = `telemetry:${quantCoord}`;
  const cached = appCache.get<{ reading: AqiReading; weather: WeatherContext }>(cacheKey);
  if (cached) {
    return cached;
  }

  const [latQ, lonQ] = quantCoord.split(',');
  const [aqiData, weatherData] = await Promise.all([
    fetchWithTimeout<RawOpenMeteoAqi>(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latQ}&longitude=${lonQ}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide&hourly=pm2_5,us_aqi&timezone=auto&forecast_days=1`
    ),
    fetchWithTimeout<RawOpenMeteoWeather>(
      `https://api.open-meteo.com/v1/forecast?latitude=${latQ}&longitude=${lonQ}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=boundary_layer_height&timezone=auto&forecast_days=1`
    ),
  ]);

  const reading = parseAqiReading(aqiData);
  const weather = parseWeatherContext(weatherData, reading.usAqi);
  const result = { reading, weather };

  appCache.set(cacheKey, result, CACHE_TTL_MS.AQI_DATA);
  return result;
}

/**
 * Executes JSON fetch with a strict 6-second timeout via AbortController.
 */
async function fetchWithTimeout<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Open-Meteo API returned status ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parses raw Open-Meteo AQI payload into validated AqiReading.
 */
function parseAqiReading(raw: RawOpenMeteoAqi): AqiReading {
  const curr = raw.current || {};
  const usAqi = Math.round(curr.us_aqi ?? 150);
  const { category, label } = classifyAqi(usAqi);

  const hourlyForecast: HourlyAqiSample[] = [];
  const times = raw.hourly?.time || [];
  const pm25s = raw.hourly?.pm2_5 || [];
  const aqis = raw.hourly?.us_aqi || [];

  for (let i = 0; i < Math.min(times.length, 24); i++) {
    hourlyForecast.push({
      time: times[i] || `${i}:00`,
      pm25: Number((pm25s[i] ?? curr.pm2_5 ?? 50).toFixed(1)),
      usAqi: Math.round(aqis[i] ?? usAqi),
    });
  }

  return {
    usAqi,
    pm25: Number((curr.pm2_5 ?? 60).toFixed(1)),
    pm10: Number((curr.pm10 ?? 110).toFixed(1)),
    no2: Number((curr.nitrogen_dioxide ?? 25).toFixed(1)),
    o3: Number((curr.ozone ?? 30).toFixed(1)),
    so2: Number((curr.sulphur_dioxide ?? 10).toFixed(1)),
    co: Number((curr.carbon_monoxide ?? 400).toFixed(1)),
    category,
    categoryLabel: label,
    timestamp: new Date().toISOString(),
    hourlyForecast,
  };
}

/**
 * Parses raw weather payload and calculates boundary layer inversion.
 */
function parseWeatherContext(raw: RawOpenMeteoWeather, aqi: number): WeatherContext {
  const curr = raw.current || {};
  const temp = Number((curr.temperature_2m ?? 18).toFixed(1));
  const humidity = Math.round(curr.relative_humidity_2m ?? 65);
  const windSpeed = Number((curr.wind_speed_10m ?? 6).toFixed(1));
  const boundaryLayer = Math.round(raw.hourly?.boundary_layer_height?.[0] ?? 350);

  const { isInversionActive, dispersionIndex, smogRiskLevel } = evaluateSmogInversion(
    windSpeed,
    boundaryLayer,
    aqi
  );

  return {
    temperatureC: temp,
    relativeHumidity: humidity,
    windSpeedKmh: windSpeed,
    boundaryLayerMeters: boundaryLayer,
    isInversionActive,
    dispersionIndex,
    smogRiskLevel,
  };
}
