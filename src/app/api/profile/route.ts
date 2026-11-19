import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { FamilyProfileModel } from '@/services/models';
import { successResponse, errorResponse } from '@/services/api-response';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'guest_user';

  try {
    await connectToDatabase();
    let profile = await FamilyProfileModel.findOne({ userId });

    if (!profile) {
      profile = await FamilyProfileModel.create({
        userId,
        name: 'My Household',
        preferredCity: 'Delhi NCR',
        familySize: 3,
        childrenPresent: true,
        elderlyPresent: false,
        outdoorWorkers: false,
        respiratorySensitivity: 'mild',
        commuteMethod: 'car',
        cookingMethod: 'lpg_gas',
        ventilationType: 'cross_ventilation',
        airPurifierAvailable: false,
        budgetPreference: 'under500',
        preferredLanguage: 'en'
      });
    }

    return successResponse({ profile });
  } catch (err: any) {
    return errorResponse(err.message || 'Database error', 'DATABASE_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || 'guest_user';

    await connectToDatabase();
    const updated = await FamilyProfileModel.findOneAndUpdate(
      { userId },
      { $set: body },
      { new: true, upsert: true, runValidators: true }
    );

    return successResponse({ profile: updated });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update family profile', 'UPDATE_ERROR', 400);
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'guest_user';

  try {
    await connectToDatabase();
    await FamilyProfileModel.findOneAndDelete({ userId });
    return successResponse({ message: 'Profile deleted successfully' });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete profile', 'DELETE_ERROR', 500);
  }
}
