import { NextRequest } from 'next/server';
import { fetchAirQualityAndWeather } from '@/services/aqi-service';
import { successResponse, errorResponse } from '@/services/api-response';

const MAJOR_INDIAN_CITIES = [
  { name: 'Delhi NCR', lat: 28.6139, lon: 77.2090 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462 }
];

export async function GET(_request: NextRequest) {
  try {
    const results = await Promise.all(
      MAJOR_INDIAN_CITIES.map(async (c) => {
        try {
          const { reading } = await fetchAirQualityAndWeather(c.lat, c.lon);
          return {
            city: c.name,
            latitude: c.lat,
            longitude: c.lon,
            usAqi: reading.usAqi,
            pm25: reading.pm25,
            pm10: reading.pm10,
            no2: reading.no2,
            category: reading.category,
            categoryLabel: reading.categoryLabel
          };
        } catch (e) {
          return {
            city: c.name,
            latitude: c.lat,
            longitude: c.lon,
            usAqi: 120,
            pm25: 42,
            pm10: 75,
            no2: 22,
            category: 'unhealthy-sensitive',
            categoryLabel: 'Unhealthy for Sensitive Groups (Offline Model)'
          };
        }
      })
    );

    return successResponse({ cities: results });
  } catch (err: any) {
    return errorResponse(err.message || 'City compare error', 'CITY_COMPARE_ERROR', 500);
  }
}
