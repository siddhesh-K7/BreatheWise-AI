import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useAqi } from '@/hooks/useAqi';
import { usePlan } from '@/hooks/usePlan';
import Home from '@/app/page';

describe('Custom Hooks & Main Dashboard Page Unit Tests', () => {
  it('useAqi initializes with Delhi NCR and allows selecting other presets', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          reading: {
            usAqi: 120,
            pm25: 60,
            pm10: 110,
            no2: 25,
            o3: 30,
            so2: 10,
            co: 400,
            category: 'unhealthy-sensitive',
            categoryLabel: 'Unhealthy for Sensitive Groups',
            timestamp: new Date().toISOString(),
            hourlyForecast: [],
          },
          weather: {
            temperatureC: 22,
            relativeHumidity: 60,
            windSpeedKmh: 8,
            boundaryLayerMeters: 450,
            isInversionActive: false,
            dispersionIndex: 1.0,
            smogRiskLevel: 'moderate',
          },
        },
      }),
    } as Response);

    const { result } = renderHook(() => useAqi());
    expect(result.current.location.cityName).toBe('Delhi NCR');

    act(() => {
      result.current.selectPreset('chennai');
    });

    expect(result.current.location.cityName).toBe('Chennai');
  });

  it('useAqi handles geolocation success and denied error callbacks', async () => {
    let mockError = false;
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success, error) => {
        if (mockError) {
          error({ message: 'User denied geolocation' });
        } else {
          success({ coords: { latitude: 12.9716, longitude: 77.5946 } });
        }
      }),
    };
    Object.assign(navigator, { geolocation: mockGeolocation });

    const { result } = renderHook(() => useAqi());

    act(() => {
      result.current.requestGeolocation();
    });

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    expect(result.current.location.cityName).toBe('My Location');

    // Test error branch
    mockError = true;
    act(() => {
      result.current.requestGeolocation();
    });
    expect(result.current.error).toContain('Location access declined');

    // Test unsupported geolocation branch
    const originalGeo = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true, writable: true });
    act(() => {
      result.current.requestGeolocation();
    });
    expect(result.current.error).toBe('Geolocation is not supported by your browser.');
    Object.defineProperty(navigator, 'geolocation', { value: originalGeo, configurable: true, writable: true });
  });

  it('useAqi handles API failure responses', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: 'Telemetry unavailable' } }),
    } as Response);

    const { result } = renderHook(() => useAqi());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.error).toBe('Telemetry unavailable');
  });

  it('usePlan manages profile updates and plan generation cycle', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          summary: 'Generated Action Plan',
          dailyRoutines: [],
          indoorHacks: [],
          sustainableAlternatives: [],
          healthGuidance: [],
          quantifiedImpact: {
            pm25ReductionPercent: 40,
            pm25SavedMicrograms: 150,
            avoidedCigarettesPerDay: 3,
            avoidedCo2KgPerDay: 2,
          },
          winterSmogAdvisory: {
            diwaliStubbleAlert: 'None',
            inversionGuidance: 'None',
            peakHoursWarning: 'None',
          },
          isFallback: false,
          generatedAt: new Date().toISOString(),
        },
      }),
    } as Response);

    const { result } = renderHook(() => usePlan());
    expect(result.current.profile.commuteMode).toBe('car');

    await act(async () => {
      await result.current.generatePlan({ latitude: 13.08, longitude: 80.27, cityName: 'Chennai' }, 'en');
    });

    expect(result.current.plan?.summary).toBe('Generated Action Plan');

    // Test API error response
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: 'Plan service unavailable' } }),
    } as Response);
    await act(async () => {
      await result.current.generatePlan({ latitude: 13.08, longitude: 80.27, cityName: 'Chennai' }, 'en');
    });
    expect(result.current.error).toBe('Plan service unavailable');

    // Test non-Error exception rejection
    vi.spyOn(global, 'fetch').mockRejectedValueOnce('raw rejection');
    await act(async () => {
      await result.current.generatePlan({ latitude: 13.08, longitude: 80.27, cityName: 'Chennai' }, 'en');
    });
    expect(result.current.error).toBe('Plan synthesis failed');
  });

  it('renders Home page dashboard end-to-end and triggers plan generation', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          reading: {
            usAqi: 320,
            pm25: 220,
            pm10: 350,
            no2: 40,
            o3: 20,
            so2: 15,
            co: 800,
            category: 'hazardous',
            categoryLabel: 'Hazardous',
            timestamp: new Date().toISOString(),
            hourlyForecast: [],
          },
          weather: {
            temperatureC: 15,
            relativeHumidity: 75,
            windSpeedKmh: 4,
            boundaryLayerMeters: 200,
            isInversionActive: true,
            dispersionIndex: 0.22,
            smogRiskLevel: 'critical',
          },
          summary: 'Generated Action Plan for Home',
          dailyRoutines: [],
          indoorHacks: [],
          sustainableAlternatives: [],
          healthGuidance: [],
          quantifiedImpact: {
            pm25ReductionPercent: 40,
            pm25SavedMicrograms: 150,
            avoidedCigarettesPerDay: 3,
            avoidedCo2KgPerDay: 2,
          },
          winterSmogAdvisory: {
            diwaliStubbleAlert: 'None',
            inversionGuidance: 'None',
            peakHoursWarning: 'None',
          },
          isFallback: false,
          generatedAt: new Date().toISOString(),
        },
      }),
    } as Response);

    render(<Home />);
    expect(await screen.findByText('AirWise')).toBeInTheDocument();
    expect(screen.getByText('Quick Metropolitan Presets:')).toBeInTheDocument();

    const generateBtn = screen.getByText('Generate AI Smog Action Plan');
    fireEvent.click(generateBtn);
  });
});
