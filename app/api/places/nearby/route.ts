import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Place from '@/lib/models/Place';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET nearby places using geospatial query
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const lng = parseFloat(searchParams.get('lng') || '0');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const maxDistance = parseInt(searchParams.get('maxDistance') || '5000'); // meters

    if (!lng || !lat) {
      return errorResponse('Longitude and latitude are required', 400);
    }

    const places = await Place.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistance,
        },
      },
    })
      .populate('createdBy', 'name username profileImage')
      .limit(50);

    return successResponse({ places, count: places.length });
  } catch (error: any) {
    console.error('Get nearby places error:', error);
    return errorResponse(error.message || 'Failed to get nearby places', 500);
  }
}

export const GET = authenticate(getHandler);
