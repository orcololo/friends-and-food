import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Place from '@/lib/models/Place';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET all places with pagination
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const places = await Place.find()
      .populate('createdBy', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Place.countDocuments();

    return successResponse({
      places,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get places error:', error);
    return errorResponse(error.message || 'Failed to get places', 500);
  }
}

// POST create new place
async function postHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, description, address, location, cuisine, priceRange, images } = body;

    // Validate required fields
    if (!name || !address || !location || !cuisine || !priceRange) {
      return errorResponse('Name, address, location, cuisine, and price range are required', 400);
    }

    // Create new place
    const place = await Place.create({
      name,
      description,
      address,
      location,
      cuisine,
      priceRange,
      images: images || [],
      createdBy: req.user?.userId,
    });

    await place.populate('createdBy', 'name username profileImage');

    return successResponse(place, 201);
  } catch (error: any) {
    console.error('Create place error:', error);
    return errorResponse(error.message || 'Failed to create place', 500);
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);
