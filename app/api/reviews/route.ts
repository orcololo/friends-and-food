import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Review from '@/lib/models/Review';
import Place from '@/lib/models/Place';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// POST create review
async function postHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { placeId, rating, comment, images } = body;

    // Validate required fields
    if (!placeId || !rating) {
      return errorResponse('Place and rating are required', 400);
    }

    // Check if place exists
    const place = await Place.findById(placeId);
    if (!place) {
      return errorResponse('Place not found', 404);
    }

    // Check if user already reviewed this place
    const existingReview = await Review.findOne({
      userId: req.user?.userId,
      placeId,
    });

    if (existingReview) {
      return errorResponse('You have already reviewed this place', 400);
    }

    // Create review
    const review = await Review.create({
      userId: req.user?.userId,
      placeId,
      rating,
      comment,
      images: images || [],
    });

    // Update place average rating
    const reviews = await Review.find({ placeId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Place.findByIdAndUpdate(placeId, { averageRating: avgRating });

    await review.populate('userId', 'name username profileImage');

    return successResponse(review, 201);
  } catch (error: any) {
    console.error('Create review error:', error);
    return errorResponse(error.message || 'Failed to create review', 500);
  }
}

export const POST = authenticate(postHandler);
