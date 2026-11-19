import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { PollutionAlertModel } from '@/services/models';
import { successResponse, errorResponse } from '@/services/api-response';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'guest_user';

  try {
    await connectToDatabase();
    const alerts = await PollutionAlertModel.find({ userId }).sort({ createdAt: -1 }).limit(20);
    return successResponse({ alerts });
  } catch (err: any) {
    return errorResponse(err.message || 'Alerts error', 'ALERT_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'guest_user', city = 'Delhi NCR', thresholdAqi = 150, currentAqi = 180, severity = 'warning', message } = body;

    await connectToDatabase();
    const alert = await PollutionAlertModel.create({
      userId,
      city,
      thresholdAqi,
      currentAqi,
      severity,
      message: message || `High PM2.5 Alert: Current AQI in ${city} is ${currentAqi}, surpassing safety threshold ${thresholdAqi}.`
    });

    return successResponse({ alert });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create alert', 'CREATE_ALERT_ERROR', 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId } = body;

    await connectToDatabase();
    const alert = await PollutionAlertModel.findByIdAndUpdate(alertId, { isRead: true }, { new: true });
    return successResponse({ alert });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update alert', 'UPDATE_ALERT_ERROR', 500);
  }
}
