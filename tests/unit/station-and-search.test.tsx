import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TRANSLATIONS } from '@/config/translations';
import { StationCrossCheckCard } from '@/components/aqi/StationCrossCheckCard';
import { InversionCard } from '@/components/aqi/InversionCard';
import { CitySearchBar } from '@/components/layout/CitySearchBar';
import { PresetBar } from '@/components/layout/PresetBar';
import { LocationQuery } from '@/domain/types';

const t = TRANSLATIONS.en;

describe('StationCrossCheckCard & CitySearchBar Unit Tests', () => {
  it('renders StationCrossCheckCard fallback notice when station reading is offline', () => {
    const crossCheck = {
      modelAqi: 180,
      stationReading: {
        isAvailable: false,
        statusReason: 'WAQI token not configured in vault',
      },
      disagreementDetected: false,
      deviation: 0,
      effectiveSafetyAqi: 180,
    };

    render(<StationCrossCheckCard crossCheck={crossCheck} />);
    expect(screen.getByText('Multi-Source Cross-Check')).toBeInTheDocument();
    expect(screen.getByText(/WAQI token not configured/)).toBeInTheDocument();
  });

  it('renders StationCrossCheckCard disagreement alert when deviation > 50', () => {
    const crossCheck = {
      modelAqi: 180,
      stationReading: {
        isAvailable: true,
        stationName: 'US Embassy Delhi',
        stationAqi: 275,
        dominantPollutant: 'PM2.5',
        timestamp: '2026-11-17T08:00:00Z',
        distanceKm: 5.2,
      },
      disagreementDetected: true,
      deviation: 95,
      effectiveSafetyAqi: 275,
    };

    render(<StationCrossCheckCard crossCheck={crossCheck} />);
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('275')).toBeInTheDocument();
    expect(screen.getByText(/Data sources disagree/)).toBeInTheDocument();
    expect(screen.getByText(/Safety guidance elevated to AQI 275/)).toBeInTheDocument();
  });

  it('renders StationCrossCheckCard when sensors agree and returns null when null', () => {
    const { container } = render(<StationCrossCheckCard crossCheck={null} />);
    expect(container.firstChild).toBeNull();

    const crossCheckAgree = {
      modelAqi: 100,
      stationReading: {
        isAvailable: true,
        stationName: 'Chennai Station',
        stationAqi: 110,
        dominantPollutant: 'PM2.5',
        timestamp: '2026-11-17T08:00:00Z',
        distanceKm: 2.1,
      },
      disagreementDetected: false,
      deviation: 10,
      effectiveSafetyAqi: 110,
    };

    render(<StationCrossCheckCard crossCheck={crossCheckAgree} />);
    expect(screen.getByText(/Sensors agree within tolerance/)).toBeInTheDocument();
  });

  it('renders CitySearchBar, queries autocomplete API, and selects location', async () => {
    const onSelect = vi.fn();
    const mockResults = [
      { id: 101, name: 'Varanasi', latitude: 25.31, longitude: 82.97, country: 'India', countryCode: 'IN', admin1: 'Uttar Pradesh' },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockResults }), { status: 200 })
    );

    render(<CitySearchBar onSelectLocation={onSelect} />);
    const input = screen.getByLabelText('Search city or town');
    fireEvent.change(input, { target: { value: 'Varanasi' } });

    await waitFor(() => {
      expect(screen.getByText('Varanasi')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Varanasi'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ cityName: 'Varanasi', latitude: 25.31, longitude: 82.97 })
    );
  });

  it('renders PresetBar and handles preset buttons, search selection, and locate me', () => {
    const onSelectPreset = vi.fn();
    const onSelectLocation = vi.fn();
    const onRequestLocation = vi.fn();
    const loc: LocationQuery = { latitude: 28.61, longitude: 77.23, cityName: 'Delhi NCR' };

    render(
      <PresetBar
        activeLocation={loc}
        onSelectPreset={onSelectPreset}
        onSelectLocation={onSelectLocation}
        onRequestLocation={onRequestLocation}
        t={t}
      />
    );

    fireEvent.click(screen.getByText('Chennai'));
    expect(onSelectPreset).toHaveBeenCalledWith('chennai');

    fireEvent.click(screen.getByText(t.locateMe));
    expect(onRequestLocation).toHaveBeenCalled();
  });

  it('renders InversionCard with upwind fireSummary anomaly banner', () => {
    const weather = {
      temperatureC: 18,
      relativeHumidity: 65,
      windSpeedKmh: 4.2,
      boundaryLayerMeters: 220,
      isInversionActive: true,
      dispersionIndex: 0.25,
      smogRiskLevel: 'critical' as const,
    };
    const fire = {
      isAvailable: true,
      count24h: 428,
      count72h: 1385,
      radiusKm: 150,
      isSeasonalBaseline: true,
      advisoryText: '428 active thermal anomaly detections',
    };

    render(<InversionCard weather={weather} fireSummary={fire} t={t} />);
    expect(screen.getByText('Upwind Thermal Anomalies')).toBeInTheDocument();
    expect(screen.getByText('Seasonal Baseline')).toBeInTheDocument();
  });

  it('allows clearing search input in CitySearchBar via clear button', () => {
    render(<CitySearchBar onSelectLocation={() => {}} />);
    const input = screen.getByLabelText('Search city or town') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Kolkata' } });
    expect(input.value).toBe('Kolkata');

    const clearBtn = screen.getByLabelText('Clear search query');
    fireEvent.click(clearBtn);
    expect(input.value).toBe('');
  });
});
