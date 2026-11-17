/**
 * @fileoverview Deterministic mathematical impact engine for AirWise.
 * Calculates particulate dose reductions, Berkeley Earth cigarette equivalents,
 * and carbon mitigation based on published empirical environmental models.
 */

import {
  BERKELEY_EARTH_PM25_PER_CIGARETTE,
  BREATHING_RATES_M3_PER_HOUR,
  INTERVENTION_EFFICIENCIES,
  TRANSIT_EMISSION_FACTORS,
} from '@/config/constants';
import { QuantifiedImpact, UserProfile } from '@/domain/types';

/**
 * Computes deterministic quantified impacts for a given profile and PM2.5 baseline.
 * @param ambientPm25 Current ambient PM2.5 concentration in micrograms per cubic meter
 * @param profile Active user household demographic and lifestyle profile
 */
export function calculateImpact(ambientPm25: number, profile: UserProfile): QuantifiedImpact {
  const safePm25 = Math.max(0, ambientPm25);

  const indoorEfficiency = computeIndoorFiltrationEfficiency(profile);
  const commuteEfficiency = computeCommuteMitigationEfficiency(profile);

  // Time-weighted daily average efficiency: 18h indoor + 6h commute/outdoor
  const compositeReductionFraction = (indoorEfficiency * 18 + commuteEfficiency * 6) / 24;
  const pm25ReductionPercent = Number((compositeReductionFraction * 100).toFixed(1));

  // Compute daily inhaled dose saved in micrograms
  const baselineInhaled =
    safePm25 *
    (18 * BREATHING_RATES_M3_PER_HOUR.SEDENTARY_INDOOR +
      6 * BREATHING_RATES_M3_PER_HOUR.MODERATE_COMMUTE);
  const interventionInhaled =
    safePm25 *
    (18 * BREATHING_RATES_M3_PER_HOUR.SEDENTARY_INDOOR * (1 - indoorEfficiency) +
      6 * BREATHING_RATES_M3_PER_HOUR.MODERATE_COMMUTE * (1 - commuteEfficiency));
  const pm25SavedMicrograms = Number(Math.max(0, baselineInhaled - interventionInhaled).toFixed(1));

  // Berkeley Earth: 22 micrograms/m^3 PM2.5 24h exposure equals 1 cigarette
  const avoidedCigarettesPerDay = Number(
    ((safePm25 * compositeReductionFraction) / BERKELEY_EARTH_PM25_PER_CIGARETTE).toFixed(1)
  );

  const avoidedCo2KgPerDay = computeDailyCo2Savings(profile);

  return {
    pm25ReductionPercent,
    pm25SavedMicrograms,
    avoidedCigarettesPerDay,
    avoidedCo2KgPerDay,
  };
}

/**
 * Derives indoor particulate removal efficiency based on purifier ownership and ventilation.
 */
function computeIndoorFiltrationEfficiency(profile: UserProfile): number {
  if (profile.hasPurifier) {
    return INTERVENTION_EFFICIENCIES.TRUE_HEPA_PURIFIER;
  }
  if (profile.homeVentilation === 'tight-sealed') {
    return INTERVENTION_EFFICIENCIES.DIY_BOX_FAN_MERV13;
  }
  if (profile.homeVentilation === 'standard') {
    return INTERVENTION_EFFICIENCIES.WET_MOPPING_SEALING;
  }
  return 0.1; // Baseline drafty dwelling
}

/**
 * Derives commute particulate shielding based on transport setting and mask availability.
 */
function computeCommuteMitigationEfficiency(profile: UserProfile): number {
  if (profile.commuteMode === 'wfh') {
    return computeIndoorFiltrationEfficiency(profile);
  }
  if (profile.commuteMode === 'metro') {
    return 0.65; // Enclosed underground air-conditioned filtration
  }
  return INTERVENTION_EFFICIENCIES.CERTIFIED_N95_MASK; // Recommending certified N95 for road transit
}

/**
 * Computes daily CO2 avoidance in kilograms from sustainable commute and clean cooking shifts.
 */
export function computeDailyCo2Savings(profile: UserProfile): number {
  let co2SavingsGrams = 0;

  // Commute mode shift toward electric metro
  if (profile.commuteMode === 'car') {
    const diff = TRANSIT_EMISSION_FACTORS.PETROL_CAR_SOLO - TRANSIT_EMISSION_FACTORS.ELECTRIC_METRO;
    co2SavingsGrams += diff * profile.dailyCommuteKm;
  } else if (profile.commuteMode === 'two-wheeler') {
    const diff =
      TRANSIT_EMISSION_FACTORS.TWO_WHEELER_PETROL - TRANSIT_EMISSION_FACTORS.ELECTRIC_METRO;
    co2SavingsGrams += diff * profile.dailyCommuteKm;
  }

  // Clean cooking fuel shift away from solid biomass
  if (profile.cookingFuel === 'biomass-firewood') {
    co2SavingsGrams += 2000; // ~2.0 kg CO2 equivalent saved per day
  }

  return Number((co2SavingsGrams / 1000).toFixed(2));
}

/**
 * Re-computes impact figures dynamically for client-side what-if simulation toggles.
 */
export function simulateWhatIf(
  currentPm25: number,
  baseProfile: UserProfile,
  toggles: Partial<UserProfile>
): QuantifiedImpact {
  const mergedProfile: UserProfile = { ...baseProfile, ...toggles };
  return calculateImpact(currentPm25, mergedProfile);
}
