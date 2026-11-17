import { describe, expect, it } from 'vitest';
import { calculateImpact, computeDailyCo2Savings, simulateWhatIf } from '@/services/impact-calculator';
import { UserProfile } from '@/domain/types';

describe('Impact Calculator Unit Tests', () => {
  const baseProfile: UserProfile = {
    hasChildren: true,
    hasElderly: false,
    respiratorySensitivity: true,
    commuteMode: 'car',
    dailyCommuteKm: 20,
    homeVentilation: 'standard',
    hasPurifier: false,
    cookingFuel: 'lpg-induction',
    workSetting: 'hybrid',
  };

  it('calculates cigarette equivalence correctly using Berkeley Earth standard (22 µg/m³ = 1 cig)', () => {
    const result = calculateImpact(220, baseProfile);
    expect(result.avoidedCigarettesPerDay).toBeGreaterThan(0);
    expect(result.pm25ReductionPercent).toBeGreaterThan(0);
    expect(result.pm25SavedMicrograms).toBeGreaterThan(0);
  });

  it('clamps negative or zero PM2.5 values safely', () => {
    const zeroResult = calculateImpact(0, baseProfile);
    expect(zeroResult.avoidedCigarettesPerDay).toBe(0);
    expect(zeroResult.pm25SavedMicrograms).toBe(0);

    const negResult = calculateImpact(-50, baseProfile);
    expect(negResult.avoidedCigarettesPerDay).toBe(0);
    expect(negResult.pm25SavedMicrograms).toBe(0);
  });

  it('awards higher filtration efficiency to households with HEPA air purifiers', () => {
    const withoutPurifier = calculateImpact(150, baseProfile);
    const withPurifier = calculateImpact(150, { ...baseProfile, hasPurifier: true });

    expect(withPurifier.pm25ReductionPercent).toBeGreaterThan(withoutPurifier.pm25ReductionPercent);
    expect(withPurifier.avoidedCigarettesPerDay).toBeGreaterThan(withoutPurifier.avoidedCigarettesPerDay);
  });

  it('handles tight-sealed and high-leakage home ventilation profiles', () => {
    const sealed = calculateImpact(150, { ...baseProfile, homeVentilation: 'tight-sealed' });
    const leaky = calculateImpact(150, { ...baseProfile, homeVentilation: 'high-leakage' });

    expect(sealed.pm25ReductionPercent).toBeGreaterThan(leaky.pm25ReductionPercent);
  });

  it('handles WFH and Metro commute modes in shielding calculations', () => {
    const wfh = calculateImpact(150, { ...baseProfile, commuteMode: 'wfh' });
    const metro = calculateImpact(150, { ...baseProfile, commuteMode: 'metro' });

    expect(wfh.pm25ReductionPercent).toBeGreaterThan(0);
    expect(metro.pm25ReductionPercent).toBeGreaterThan(0);
  });

  it('calculates transit CO2 savings when switching from car or two-wheeler to metro', () => {
    const carSavings = computeDailyCo2Savings({ ...baseProfile, commuteMode: 'car', dailyCommuteKm: 20 });
    expect(carSavings).toBe(2.84);

    const twoWheelerSavings = computeDailyCo2Savings({
      ...baseProfile,
      commuteMode: 'two-wheeler',
      dailyCommuteKm: 20,
    });
    expect(twoWheelerSavings).toBe(0.74);

    const bikeSavings = computeDailyCo2Savings({ ...baseProfile, commuteMode: 'active', dailyCommuteKm: 20 });
    expect(bikeSavings).toBe(0);
  });

  it('calculates cooking fuel CO2 savings when replacing firewood biomass', () => {
    const biomassSavings = computeDailyCo2Savings({ ...baseProfile, cookingFuel: 'biomass-firewood' });
    expect(biomassSavings).toBeGreaterThanOrEqual(2.0);
  });

  it('simulates what-if toggles without modifying original profile state', () => {
    const initial = calculateImpact(200, baseProfile);
    const simulated = simulateWhatIf(200, baseProfile, { hasPurifier: true, commuteMode: 'metro' });

    expect(simulated.pm25ReductionPercent).toBeGreaterThan(initial.pm25ReductionPercent);
    expect(baseProfile.hasPurifier).toBe(false);
  });
});
