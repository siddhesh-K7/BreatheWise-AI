import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { DailyRoutineModel } from '@/services/models';
import { successResponse, errorResponse } from '@/services/api-response';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'guest_user';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const city = searchParams.get('city') || 'Delhi NCR';
  const aqi = parseInt(searchParams.get('aqi') || '150', 10);

  try {
    await connectToDatabase();
    let routine = await DailyRoutineModel.findOne({ userId, date });

    if (!routine) {
      const isUnhealthy = aqi > 100;
      const tasks = [
        {
          id: `m_${Date.now()}_1`,
          phase: 'morning',
          title: '07:00 AM Atmospheric Inversion Check',
          description: 'Assess ground-level PM2.5 dispersion on AirWise before opening windows.',
          precaution: isUnhealthy
            ? 'Ground thermal inversion traps pollutants. Keep windows closed.'
            : 'Natural ventilation is safe.',
          completed: false
        },
        {
          id: `m_${Date.now()}_2`,
          phase: 'morning',
          title: isUnhealthy ? 'Indoor Breathing & Yoga Exercises' : 'Morning Aerobic Walk in Park',
          description: isUnhealthy
            ? 'Keep workouts indoors with HEPA air filtration.'
            : 'Safe for outdoor exercise away from traffic arterial roads.',
          precaution: 'Avoid outdoor exercise if you experience coughing or chest tightness.',
          completed: false
        },
        {
          id: `a_${Date.now()}_1`,
          phase: 'afternoon',
          title: 'Lunchtime Kitchen Fume & Exhaust Ventilation',
          description: 'Turn on kitchen exhaust fan 2 minutes prior to cooking.',
          precaution: 'Gas burners generate significant indoor NO2; keep exhaust running.',
          completed: false
        },
        {
          id: `e_${Date.now()}_1`,
          phase: 'evening',
          title: 'Post-Commute Damp Dusting Routine',
          description: 'Wipe entryway surfaces with a damp microfiber cloth to remove tracked soot.',
          precaution: 'Never dry sweep with straw brooms as it aerosolizes settled particulates.',
          completed: false
        },
        {
          id: `n_${Date.now()}_1`,
          phase: 'night',
          title: 'Bedroom Sanctuary Nighttime Sealing',
          description: 'Activate HEPA purifier sleep mode and close bedroom doors.',
          precaution: 'Maintains optimal low-PM2.5 breathing space throughout the sleep cycle.',
          completed: false
        }
      ];

      routine = await DailyRoutineModel.create({
        userId,
        date,
        city,
        usAqi: aqi,
        tasks,
        completionPercentage: 0
      });
    }

    return successResponse({ routine });
  } catch (err: any) {
    return errorResponse(err.message || 'Routine error', 'ROUTINE_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'guest_user', date, city, usAqi, tasks } = body;

    const completed = tasks.filter((t: any) => t.completed).length;
    const completionPercentage = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    await connectToDatabase();
    const routine = await DailyRoutineModel.findOneAndUpdate(
      { userId, date },
      { city, usAqi, tasks, completionPercentage },
      { new: true, upsert: true }
    );

    return successResponse({ routine });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to save daily routine', 'SAVE_ERROR', 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { routineId, taskId, completed } = body;

    await connectToDatabase();
    const routine = await DailyRoutineModel.findById(routineId);
    if (!routine) {
      return errorResponse('Routine not found', 'NOT_FOUND', 404);
    }

    routine.tasks = routine.tasks.map((t: any) => (t.id === taskId ? { ...t, completed } : t));
    const completedCount = routine.tasks.filter((t: any) => t.completed).length;
    routine.completionPercentage = Math.round((completedCount / routine.tasks.length) * 100);
    await routine.save();

    return successResponse({ routine });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update task', 'UPDATE_ERROR', 500);
  }
}
