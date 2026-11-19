import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { EnvironmentalImpactModel } from '@/services/models';
import { successResponse, errorResponse } from '@/services/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'guest_user', distanceKm = 10, baselineMode = 'car_solo', alternativeMode = 'metro', daysPerWeek = 5 } = body;

    // Use deterministic impact calculator
    const baselineFactor = baselineMode === 'diesel_suv' ? 0.254 : 0.192;
    const alternativeFactor =
      alternativeMode === 'metro'
        ? 0.029
        : alternativeMode === 'bus'
        ? 0.082
        : alternativeMode === 'carpool'
        ? 0.096
        : 0.0;

    const baselineTrip = distanceKm * baselineFactor;
    const alternativeTrip = distanceKm * alternativeFactor;
    const co2SavedPerTripKg = Math.max(0, Number((baselineTrip - alternativeTrip).toFixed(3)));
    const weeklyCo2 = Number((co2SavedPerTripKg * daysPerWeek).toFixed(2));
    const monthlyCo2SavedKg = Number((weeklyCo2 * 4.33).toFixed(2));
    const annualCo2SavedKg = Number((weeklyCo2 * 52).toFixed(2));

    const assumptions = `Distance: ${distanceKm} km, Days: ${daysPerWeek}/wk. Baseline (${baselineMode}): ${baselineFactor} kg CO2e/km. Alternative (${alternativeMode}): ${alternativeFactor} kg CO2e/km. DEFRA 2023.`;

    await connectToDatabase();
    const doc = await EnvironmentalImpactModel.create({
      userId,
      distanceKm,
      baselineMode,
      alternativeMode,
      daysPerWeek,
      co2SavedPerTripKg,
      monthlyCo2SavedKg,
      annualCo2SavedKg,
      emissionFactorSource: 'UK DEFRA / IPCC 2023 Guidelines',
      assumptions
    });

    return successResponse({ record: doc });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to calculate impact', 'CALC_ERROR', 400);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'guest_user';

  try {
    await connectToDatabase();
    const history = await EnvironmentalImpactModel.find({ userId }).sort({ createdAt: -1 }).limit(10);
    const aggregates = await EnvironmentalImpactModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalSaved: { $sum: '$co2SavedPerTripKg' },
          totalAnnual: { $sum: '$annualCo2SavedKg' },
          count: { $sum: 1 }
        }
      }
    ]);

    return successResponse({
      history,
      totals: aggregates[0] || { totalSaved: 0, totalAnnual: 0, count: 0 }
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Database error', 'DATABASE_ERROR', 500);
  }
}
