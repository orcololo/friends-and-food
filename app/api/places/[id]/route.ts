import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Place from '@/lib/models/Place';
import Review from '@/lib/models/Review';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET single place by ID
async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const place = await Place.findById(id).populate('createdBy', 'name username profileImage');

    if (!place) {
      return errorResponse('Place not found', 404);
    }

    // Get reviews for this place
    const reviews = await Review.find({ placeId: id })
      .populate('userId', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(10);

    return successResponse({ place, reviews });
  } catch (error: any) {
    console.error('Get place error:', error);
    return errorResponse(error.message || 'Failed to get place', 500);
  }
}

// PUT update place
async function putHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const place = await Place.findById(id);

    if (!place) {
      return errorResponse('Place not found', 404);
    }

    // Check if user is the creator
    if (place.createdBy.toString() !== req.user?.userId) {
      return errorResponse('Not authorized to update this place', 403);
    }

    const body = await req.json();
    const updatedPlace = await Place.findByIdAndUpdate(id, body, { new: true }).populate(
      'createdBy',
      'name username profileImage'
    );

    return successResponse(updatedPlace);
  } catch (error: any) {
    console.error('Update place error:', error);
    return errorResponse(error.message || 'Failed to update place', 500);
  }
}

// DELETE place
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const place = await Place.findById(id);

    if (!place) {
      return errorResponse('Place not found', 404);
    }

    // Check if user is the creator
    if (place.createdBy.toString() !== req.user?.userId) {
      return errorResponse('Not authorized to delete this place', 403);
    }

    await Place.findByIdAndDelete(id);

    return successResponse({ message: 'Place deleted successfully' });
  } catch (error: any) {
    console.error('Delete place error:', error);
    return errorResponse(error.message || 'Failed to delete place', 500);
  }
}

export const GET = authenticate(getHandler);
export const PUT = authenticate(putHandler);
export const DELETE = authenticate(deleteHandler);
