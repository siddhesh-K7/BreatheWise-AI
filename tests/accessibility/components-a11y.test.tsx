import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { TRANSLATIONS } from '@/config/translations';
import { HazardousBanner } from '@/components/aqi/HazardousBanner';
import { AqiBadge } from '@/components/ui/Badge';
import { InversionCard } from '@/components/aqi/InversionCard';
import { PresetBar } from '@/components/layout/PresetBar';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { WhatIfSimulator } from '@/components/simulator/WhatIfSimulator';
import { CommunityCard } from '@/components/community/CommunityCard';
import { Footer } from '@/components/layout/Footer';

const t = TRANSLATIONS.en;

describe('Automated Component Accessibility (a11y) Tests via axe-core', () => {
  it('HazardousBanner has 0 axe accessibility violations', async () => {
    const { container } = render(<HazardousBanner aqi={340} t={t} />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('AqiBadge has 0 axe accessibility violations', async () => {
    const { container } = render(<AqiBadge category="unhealthy" label="Unhealthy" />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('InversionCard has 0 axe accessibility violations', async () => {
    const weather = {
      temperatureC: 15,
      relativeHumidity: 75,
      windSpeedKmh: 4.0,
      boundaryLayerMeters: 200,
      isInversionActive: true,
      dispersionIndex: 0.22,
      smogRiskLevel: 'critical' as const,
    };
    const { container } = render(<InversionCard weather={weather} t={t} />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('PresetBar has 0 axe accessibility violations', async () => {
    const loc = { latitude: 28.61, longitude: 77.23, cityName: 'Delhi NCR' };
    const { container } = render(
      <PresetBar activeLocation={loc} onSelectPreset={() => {}} onRequestLocation={() => {}} t={t} />
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('ProfileForm has 0 axe accessibility violations', async () => {
    const profile = {
      hasChildren: true,
      hasElderly: false,
      respiratorySensitivity: true,
      commuteMode: 'metro' as const,
      dailyCommuteKm: 20,
      homeVentilation: 'standard' as const,
      hasPurifier: true,
      cookingFuel: 'lpg-induction' as const,
      workSetting: 'hybrid' as const,
    };
    const { container } = render(
      <ProfileForm profile={profile} onChange={() => {}} onSubmit={() => {}} isLoading={false} t={t} />
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('WhatIfSimulator has 0 axe accessibility violations', async () => {
    const profile = {
      hasChildren: true,
      hasElderly: false,
      respiratorySensitivity: false,
      commuteMode: 'car' as const,
      dailyCommuteKm: 20,
      homeVentilation: 'standard' as const,
      hasPurifier: false,
      cookingFuel: 'lpg-induction' as const,
      workSetting: 'hybrid' as const,
    };
    const impact = {
      pm25ReductionPercent: 40,
      pm25SavedMicrograms: 180,
      avoidedCigarettesPerDay: 3.2,
      avoidedCo2KgPerDay: 2.8,
    };
    const { container } = render(
      <WhatIfSimulator currentPm25={180} baseProfile={profile} initialImpact={impact} t={t} />
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('CommunityCard has 0 axe accessibility violations', async () => {
    const loc = { latitude: 28.61, longitude: 77.23, cityName: 'Delhi' };
    const reading = {
      usAqi: 220,
      pm25: 140,
      pm10: 250,
      no2: 40,
      o3: 30,
      so2: 15,
      co: 800,
      category: 'very-unhealthy' as const,
      categoryLabel: 'Very Unhealthy',
      timestamp: new Date().toISOString(),
      hourlyForecast: [],
    };
    const { container } = render(<CommunityCard location={loc} reading={reading} t={t} />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Footer has 0 axe accessibility violations', async () => {
    const { container } = render(<Footer t={t} />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
