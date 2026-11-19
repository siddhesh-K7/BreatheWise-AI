import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { CommunityPostModel } from '@/services/models';
import { successResponse, errorResponse } from '@/services/api-response';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  try {
    await connectToDatabase();
    const query = city ? { city } : {};
    let posts = await CommunityPostModel.find(query).sort({ createdAt: -1 }).limit(20);

    if (posts.length === 0) {
      // Seed initial high-quality civic awareness items
      posts = await CommunityPostModel.insertMany([
        {
          city: 'Delhi NCR',
          authorLabel: 'Citizen Air Guardian',
          postType: 'tip',
          title: 'Anti-Idling Near School Gates',
          content: 'Switching off car engines during child pick-up reduces concentrated diesel emissions at stroller height by 40%.',
          isVerified: true,
          upvotes: 42
        },
        {
          city: 'Delhi NCR',
          authorLabel: 'Local Resident Observation',
          postType: 'observation',
          title: 'Construction Dust Resuspension on Ring Road',
          content: 'Heavy unpaved road dust observed near flyover construction. Commuters should wear N95 respirators.',
          pollutantNoticed: 'construction_dust',
          isVerified: false,
          upvotes: 18
        },
        {
          city: 'Chennai',
          authorLabel: 'Coastal Clean Air Club',
          postType: 'challenge',
          title: 'Weekly Metro Challenge',
          content: 'Switch 3 days of solo car commute to Chennai Metro and track verified CO2 saved on AirWise.',
          isVerified: true,
          upvotes: 29
        }
      ]);
    }

    return successResponse({ posts });
  } catch (err: any) {
    return errorResponse(err.message || 'Community error', 'COMMUNITY_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city = 'Delhi NCR', authorLabel = 'Neighborhood Resident', postType = 'observation', title, content, pollutantNoticed } = body;

    if (!title || !content) {
      return errorResponse('Title and content are required', 'VALIDATION_ERROR', 400);
    }

    await connectToDatabase();
    const post = await CommunityPostModel.create({
      city,
      authorLabel,
      postType,
      title,
      content,
      pollutantNoticed,
      isVerified: false,
      upvotes: 0
    });

    return successResponse({ post });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to submit post', 'POST_ERROR', 400);
  }
}
