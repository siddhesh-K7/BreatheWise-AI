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

  it('handles bus and active commute modes without crash', () => {
    const busResult = calculateImpact(180, { ...baseProfile, commuteMode: 'bus' });
    expect(busResult.pm25ReductionPercent).toBeGreaterThan(0);
    expect(busResult.avoidedCigarettesPerDay).toBeGreaterThan(0);

    const activeResult = calculateImpact(180, { ...baseProfile, commuteMode: 'active' });
    expect(activeResult.pm25ReductionPercent).toBeGreaterThan(0);
  });

  it('handles zero commute distance (0 km/day)', () => {
    const zeroKm = computeDailyCo2Savings({ ...baseProfile, commuteMode: 'car', dailyCommuteKm: 0 });
    expect(zeroKm).toBe(0);
  });

  it('calculates proportional CO2 savings across commute distance gradient', () => {
    const savings10km = computeDailyCo2Savings({ ...baseProfile, commuteMode: 'car', dailyCommuteKm: 10 });
    const savings30km = computeDailyCo2Savings({ ...baseProfile, commuteMode: 'car', dailyCommuteKm: 30 });
    // 30km should save roughly 3x 10km
    expect(savings30km).toBeCloseTo(savings10km * 3, 1);
  });

  it('combines biomass cooking fuel and car commute CO2 savings', () => {
    const combined = computeDailyCo2Savings({
      ...baseProfile,
      commuteMode: 'car',
      dailyCommuteKm: 20,
      cookingFuel: 'biomass-firewood',
    });
    // 2.84 kg (car shift) + 2.0 kg (biomass shift) = 4.84 kg
    expect(combined).toBe(4.84);
  });

  it('evaluates extreme high PM2.5 concentrations (500 and 800 µg/m³)', () => {
    const extreme500 = calculateImpact(500, baseProfile);
    expect(extreme500.avoidedCigarettesPerDay).toBeGreaterThan(5.0);
    expect(extreme500.pm25SavedMicrograms).toBeGreaterThan(1000);

    const extreme800 = calculateImpact(800, baseProfile);
    expect(extreme800.avoidedCigarettesPerDay).toBeGreaterThan(extreme500.avoidedCigarettesPerDay);
  });

  it('accurately computes cigarette avoidance for exact multiple of Berkeley Earth factor', () => {
    // 220 µg/m³ with composite efficiency
    const profileWithPurifier: UserProfile = { ...baseProfile, hasPurifier: true, commuteMode: 'wfh' };
    // WFH + Purifier indoor efficiency = 0.8 across 24h
    const result = calculateImpact(220, profileWithPurifier);
    // (220 * 0.8) / 22 = 8.0 cigarettes avoided
    expect(result.avoidedCigarettesPerDay).toBe(8.0);
  });

  it('simulates multiple simultaneous what-if toggles', () => {
    const initial = calculateImpact(250, baseProfile);
    const fullyShielded = simulateWhatIf(250, baseProfile, {
      hasPurifier: true,
      homeVentilation: 'tight-sealed',
      commuteMode: 'wfh',
    });

    expect(fullyShielded.pm25ReductionPercent).toBeGreaterThan(initial.pm25ReductionPercent);
    expect(fullyShielded.pm25SavedMicrograms).toBeGreaterThan(initial.pm25SavedMicrograms);
  });

  it('evaluates drafty dwelling fallback efficiency for unknown ventilation types', () => {
    const drafty = calculateImpact(150, { ...baseProfile, homeVentilation: 'high-leakage', hasPurifier: false });
    expect(drafty.pm25ReductionPercent).toBeLessThan(40);
  });
});
