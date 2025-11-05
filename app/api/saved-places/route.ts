import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SavedPlace from '@/lib/models/SavedPlace';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET all saved places for the authenticated user
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const userId = req.user?.userId;

    const total = await SavedPlace.countDocuments({ userId });

    const savedPlaces = await SavedPlace.find({ userId })
      .populate({
        path: 'placeId',
        select: 'name description address location cuisine priceRange images averageRating',
      })
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Extract the actual place objects
    const places = savedPlaces.map((sp: any) => sp.placeId).filter((p: any) => p !== null);

    return successResponse({
      places,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get saved places error:', error);
    return errorResponse(error.message || 'Failed to get saved places', 500);
  }
}

export const GET = authenticate(getHandler);
