import { describe, it, expect, beforeAll } from 'vitest';
import { connectToDatabase } from '@/services/db';
import {
  FamilyProfileModel,
  DailyRoutineModel,
  EnvironmentalImpactModel
} from '@/services/models';

describe('MongoDB Models & Schema Invariants', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  it('validates FamilyProfile schema requirements', () => {
    const profile = new FamilyProfileModel({
      userId: 'test_validation_user',
      name: 'Test Household',
      familySize: 4,
      childrenPresent: true,
      budgetPreference: 'under500'
    });
    expect(profile.validateSync()).toBeUndefined();
    expect(profile.familySize).toBe(4);
    expect(profile.childrenPresent).toBe(true);
  });

  it('validates DailyRoutine tasks structure', () => {
    const routine = new DailyRoutineModel({
      userId: 'test_routine_user',
      date: '2026-11-20',
      city: 'Delhi NCR',
      usAqi: 240,
      tasks: [
        {
          id: 'task_1',
          phase: 'morning',
          title: 'Indoor Workout',
          description: 'Exercise in a HEPA room',
          completed: false
        }
      ],
      completionPercentage: 0
    });
    expect(routine.validateSync()).toBeUndefined();
    expect(routine.tasks.length).toBe(1);
    expect(routine.tasks[0].phase).toBe('morning');
  });

  it('validates EnvironmentalImpact emission accounting formula', () => {
    const distanceKm = 20;
    const baselineFactor = 0.192; // car_solo
    const alternativeFactor = 0.029; // metro
    const co2SavedPerTripKg = (baselineFactor - alternativeFactor) * distanceKm;

    const record = new EnvironmentalImpactModel({
      userId: 'test_impact_user',
      distanceKm,
      baselineMode: 'car_solo',
      alternativeMode: 'metro',
      co2SavedPerTripKg,
      monthlyCo2SavedKg: co2SavedPerTripKg * 5 * 4.33,
      annualCo2SavedKg: co2SavedPerTripKg * 5 * 52
    });

    expect(record.validateSync()).toBeUndefined();
    expect(record.co2SavedPerTripKg).toBeCloseTo(3.26, 1);
    expect(record.annualCo2SavedKg).toBeGreaterThan(100);
  });
});
