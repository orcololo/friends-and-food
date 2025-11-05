import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SavedPlace from '@/lib/models/SavedPlace';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// POST save/bookmark a place
async function postHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const userId = req.user?.userId;
    const { id: placeId } = await params;

    // Check if already saved
    const existing = await SavedPlace.findOne({ userId, placeId });
    if (existing) {
      return errorResponse('Place already saved', 400);
    }

    // Create saved place
    const savedPlace = await SavedPlace.create({
      userId,
      placeId,
    });

    return successResponse({ savedPlace, message: 'Place saved successfully' }, 201);
  } catch (error: any) {
    console.error('Save place error:', error);
    return errorResponse(error.message || 'Failed to save place', 500);
  }
}

// DELETE unsave/remove bookmark from a place
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const userId = req.user?.userId;
    const { id: placeId } = await params;

    const savedPlace = await SavedPlace.findOneAndDelete({ userId, placeId });

    if (!savedPlace) {
      return errorResponse('Saved place not found', 404);
    }

    return successResponse({ message: 'Place removed from saved' });
  } catch (error: any) {
    console.error('Unsave place error:', error);
    return errorResponse(error.message || 'Failed to unsave place', 500);
  }
}

export const POST = authenticate(postHandler);
export const DELETE = authenticate(deleteHandler);
