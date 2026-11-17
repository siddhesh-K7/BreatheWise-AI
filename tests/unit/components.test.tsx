import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TRANSLATIONS, getTranslation } from '@/config/translations';
import { AqiOverview } from '@/components/aqi/AqiOverview';
import { HazardousBanner } from '@/components/aqi/HazardousBanner';
import { InversionCard } from '@/components/aqi/InversionCard';
import { StreamingChat } from '@/components/chat/StreamingChat';
import { PlanDisplay } from '@/components/plan/PlanDisplay';
import { Navbar } from '@/components/layout/Navbar';
import { SkipLink } from '@/components/layout/SkipLink';
import { MetricCard } from '@/components/ui/MetricCard';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { CommunityCard } from '@/components/community/CommunityCard';
import { WhatIfSimulator } from '@/components/simulator/WhatIfSimulator';
import { AqiBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import ErrorBoundary from '@/app/error';
import { AirWisePlan, AqiCategory, AqiReading, LocationQuery, UserProfile } from '@/domain/types';

const t = TRANSLATIONS.en;

describe('UI Presentation Components Unit Tests', () => {
  const mockLocation: LocationQuery = { latitude: 28.61, longitude: 77.23, cityName: 'Delhi NCR' };
  const mockReading: AqiReading = {
    usAqi: 245,
    pm25: 160,
    pm10: 280,
    no2: 45,
    o3: 20,
    so2: 15,
    co: 800,
    category: 'very-unhealthy',
    categoryLabel: 'Very Unhealthy',
    timestamp: new Date().toISOString(),
    hourlyForecast: [
      { time: '2026-11-17T06:00', pm25: 160, usAqi: 245 },
      { time: '2026-11-17T07:00', pm25: 150, usAqi: 230 },
    ],
  };

  it('renders AqiOverview with pollutant matrix and hourly trend', () => {
    render(<AqiOverview location={mockLocation} reading={mockReading} t={t} />);
    expect(screen.getByText('Delhi NCR')).toBeInTheDocument();
    expect(screen.getByText('245')).toBeInTheDocument();
    expect(screen.getByText('PM2.5')).toBeInTheDocument();
    expect(screen.getByText('PM10')).toBeInTheDocument();
  });

  it('renders Navbar and triggers language change handlers', () => {
    const onLang = vi.fn();
    render(<Navbar currentLanguage="en" onLanguageChange={onLang} />);
    expect(screen.getByText('AirWise')).toBeInTheDocument();

    const tamilBtn = screen.getByText('தமிழ்');
    fireEvent.click(tamilBtn);
    expect(onLang).toHaveBeenCalledWith('ta');

    const hindiBtn = screen.getByText('हिन्दी');
    fireEvent.click(hindiBtn);
    expect(onLang).toHaveBeenCalledWith('hi');
  });

  it('renders SkipLink pointing to #main-content', () => {
    render(<SkipLink />);
    const link = screen.getByText('Skip to main content');
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('renders MetricCard with labels, values, and variants', () => {
    const { rerender } = render(<MetricCard label="Cigarettes Avoided" value="4.5" unit="cig/day" subtext="Daily reduction" variant="highlight" icon={<span data-testid="metric-icon">icon</span>} />);
    expect(screen.getByText('Cigarettes Avoided')).toBeInTheDocument();
    expect(screen.getByTestId('metric-icon')).toBeInTheDocument();

    rerender(<MetricCard label="CO2 Avoided" value="2.8" variant="danger" />);
    expect(screen.getByText('CO2 Avoided')).toBeInTheDocument();

    rerender(<MetricCard label="Default Variant" value="10" variant="default" />);
    expect(screen.getByText('Default Variant')).toBeInTheDocument();
  });

  it('renders HazardousBanner only when AQI > 300', () => {
    const { container, rerender } = render(<HazardousBanner aqi={250} t={t} />);
    expect(container.firstChild).toBeNull();

    rerender(<HazardousBanner aqi={350} t={t} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/AQI 350/)).toBeInTheDocument();
  });

  it('renders InversionCard under normal dispersion when inversion is inactive', () => {
    const normalWeather = {
      temperatureC: 25,
      relativeHumidity: 45,
      windSpeedKmh: 14,
      boundaryLayerMeters: 800,
      isInversionActive: false,
      dispersionIndex: 3.1,
      smogRiskLevel: 'low' as const,
    };
    render(<InversionCard weather={normalWeather} fireSummary={null} t={t} />);
    expect(screen.getByText('Normal Dispersion')).toBeInTheDocument();
  });

  it('falls back to English in getTranslation for unsupported language keys', () => {
    const fallbackDict = getTranslation('xx' as any);
    expect(fallbackDict.appTitle).toBe(TRANSLATIONS.en.appTitle);
  });

  it('renders Button across all variants, sizes, and loading state', () => {
    const { rerender } = render(<Button variant="secondary" size="sm">Secondary</Button>);
    expect(screen.getByText('Secondary')).toBeInTheDocument();

    rerender(<Button variant="outline" size="lg">Outline</Button>);
    expect(screen.getByText('Outline')).toBeInTheDocument();

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByText('Danger')).toBeInTheDocument();

    rerender(<Button isLoading={true}>Submit</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders AqiBadge across all categorical tiers', () => {
    const categories: AqiCategory[] = ['good', 'moderate', 'unhealthy-sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'];
    categories.forEach((cat) => {
      const { unmount } = render(<AqiBadge category={cat} label={cat} />);
      expect(screen.getByText(cat)).toBeInTheDocument();
      unmount();
    });

    const { unmount: unmountUnknown } = render(<AqiBadge category={'unrecognized' as any} label="Unknown Category" />);
    expect(screen.getByText('Unknown Category')).toBeInTheDocument();
    unmountUnknown();
  });

  it('exercises all interactive toggles in WhatIfSimulator', () => {
    const profile: UserProfile = {
      hasChildren: true,
      hasElderly: false,
      respiratorySensitivity: false,
      commuteMode: 'car',
      dailyCommuteKm: 20,
      homeVentilation: 'standard',
      hasPurifier: false,
      cookingFuel: 'biomass-firewood',
      workSetting: 'hybrid',
    };
    const impact = {
      pm25ReductionPercent: 40,
      pm25SavedMicrograms: 180,
      avoidedCigarettesPerDay: 3.2,
      avoidedCo2KgPerDay: 2.8,
    };

    render(<WhatIfSimulator currentPm25={200} baseProfile={profile} initialImpact={impact} t={t} />);

    fireEvent.click(screen.getByText('HEPA Air Purifier'));
    fireEvent.click(screen.getByText('Shift to Metro Rail'));
    fireEvent.click(screen.getByText('Weatherize & Seal'));
    fireEvent.click(screen.getByText('Induction Cooking'));
    fireEvent.click(screen.getByText('HEPA Air Purifier'));
  });

  it('renders ProfileForm and exercises all input changes and selects', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const profile: UserProfile = {
      hasChildren: false,
      hasElderly: false,
      respiratorySensitivity: false,
      commuteMode: 'car',
      dailyCommuteKm: 20,
      homeVentilation: 'standard',
      hasPurifier: false,
      cookingFuel: 'lpg-induction',
      workSetting: 'hybrid',
    };

    render(
      <ProfileForm
        profile={profile}
        onChange={onChange}
        onSubmit={onSubmit}
        isLoading={false}
        t={t}
      />
    );

    fireEvent.click(screen.getByLabelText('Children under 12'));
    expect(onChange).toHaveBeenCalled();

    const commuteSelect = screen.getByLabelText(/Primary Commute Mode/);
    fireEvent.change(commuteSelect, { target: { value: 'metro' } });
    expect(onChange).toHaveBeenCalled();

    const kmSlider = screen.getByLabelText(/Round-Trip Commute/);
    fireEvent.change(kmSlider, { target: { value: '35' } });
    expect(onChange).toHaveBeenCalled();

    const ventSelect = screen.getByLabelText(/Home Ventilation/);
    fireEvent.change(ventSelect, { target: { value: 'tight-sealed' } });
    expect(onChange).toHaveBeenCalled();

    const fuelSelect = screen.getByLabelText(/Cooking Fuel/);
    fireEvent.change(fuelSelect, { target: { value: 'biomass-firewood' } });
    expect(onChange).toHaveBeenCalled();

    fireEvent.click(screen.getByText('No Purifier'));
    expect(onChange).toHaveBeenCalled();
  });

  it('renders CommunityCard, copies summary, and renders non-severe directives', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<CommunityCard location={mockLocation} reading={mockReading} t={t} />);
    const copyBtn = screen.getByText('Share Notice');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(await screen.findByText('Copied to Clipboard!')).toBeInTheDocument();

    const moderateReading: AqiReading = { ...mockReading, usAqi: 85, category: 'moderate', categoryLabel: 'Moderate' };
    render(<CommunityCard location={mockLocation} reading={moderateReading} t={t} />);
    expect(screen.getByText(/Monitor outdoor exertion/)).toBeInTheDocument();
  });

  it('renders PlanDisplay with interactive tab switching', () => {
    const mockPlan: AirWisePlan = {
      summary: 'Test summary plan for family',
      dailyRoutines: [
        {
          timeBlock: '06:00-09:00',
          action: 'Stay indoors',
          rationale: 'Smog peak',
          emissionReduction: 'High',
          targetAqiCondition: 'Severe',
        },
      ],
      indoorHacks: [
        {
          title: 'Damp Mopping',
          description: 'Prevents dust',
          costTier: 'free',
          costLabel: 'Free',
          expectedReductionPercent: 20,
        },
      ],
      sustainableAlternatives: [
        {
          category: 'commute',
          currentPractice: 'Car',
          sustainableChoice: 'Metro Rail',
          co2Impact: '2.5 kg CO2',
        },
      ],
      healthGuidance: [
        {
          group: 'infants_children',
          advisory: 'Keep kids indoors',
          criticalRestrictions: ['No morning sports'],
        },
      ],
      quantifiedImpact: {
        pm25ReductionPercent: 50,
        pm25SavedMicrograms: 200,
        avoidedCigarettesPerDay: 4,
        avoidedCo2KgPerDay: 2.5,
      },
      winterSmogAdvisory: {
        diwaliStubbleAlert: 'Stubble smoke active',
        inversionGuidance: 'Inversion cap low',
        peakHoursWarning: 'Peak 6-10 AM',
      },
      isFallback: true,
      generatedAt: new Date().toISOString(),
    };

    render(<PlanDisplay plan={mockPlan} t={t} />);
    expect(screen.getByText('Test summary plan for family')).toBeInTheDocument();
    expect(screen.getByText('Stay indoors')).toBeInTheDocument();

    fireEvent.click(screen.getByText(t.indoorHacksTab));
    expect(screen.getByText('Damp Mopping')).toBeInTheDocument();

    fireEvent.click(screen.getByText(t.sustainableTab));
    expect(screen.getByText('Metro Rail')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Health Guidance'));
    expect(screen.getByText('Keep kids indoors')).toBeInTheDocument();
  });

  it('renders StreamingChat, handles successful streaming and connection failure branches', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    // Success branch
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => {
          let count = 0;
          return {
            read: async () => {
              if (count === 0) {
                count++;
                return { value: new TextEncoder().encode('Wear certified N95 masks.'), done: false };
              }
              return { value: undefined, done: true };
            },
          };
        },
      },
    } as unknown as Response);

    render(<StreamingChat currentAqi={245} currentPm25={160} cityName="Delhi" language="en" t={t} />);

    const input = screen.getByLabelText('Chat query input');
    fireEvent.change(input, { target: { value: 'What mask should I wear?' } });
    fireEvent.click(screen.getByText('Send Message'));

    expect(await screen.findByText('Wear certified N95 masks.')).toBeInTheDocument();

    // Error branch
    fetchSpy.mockRejectedValueOnce(new Error('Network disconnected'));
    fireEvent.change(input, { target: { value: 'Is it safe outside?' } });
    fireEvent.click(screen.getByText('Send Message'));

    expect(await screen.findByText(/connection disruption/)).toBeInTheDocument();
  });

  it('renders ErrorBoundary with error message and triggers reset', () => {
    const resetFn = vi.fn();
    render(<ErrorBoundary error={new Error('Simulated crash')} reset={resetFn} />);

    expect(screen.getByText('Simulated crash')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Attempt Recovery'));
    expect(resetFn).toHaveBeenCalled();
  });
});
