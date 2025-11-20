import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Review from '@/lib/models/Review';
import Place from '@/lib/models/Place';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET single review
async function getHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const review = await Review.findById(id)
      .populate('userId', 'name username profileImage')
      .populate('placeId', 'name address');

    if (!review) {
      return errorResponse('Review not found', 404);
    }

    return successResponse(review);
  } catch (error: any) {
    console.error('Get review error:', error);
    return errorResponse(error.message || 'Failed to get review', 500);
  }
}

// PUT update review
async function putHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { rating, comment, images } = body;

    // Find review
    const review = await Review.findById(id);
    if (!review) {
      return errorResponse('Review not found', 404);
    }

    // Check if user is the review owner
    if (review.userId.toString() !== req.user?.userId) {
      return errorResponse('Unauthorized: You can only edit your own reviews', 403);
    }

    // Update review fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return errorResponse('Rating must be between 1 and 5', 400);
      }
      review.rating = rating;
    }
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;

    await review.save();

    // Recalculate place average rating
    const reviews = await Review.find({ placeId: review.placeId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Place.findByIdAndUpdate(review.placeId, { averageRating: avgRating });

    await review.populate('userId', 'name username profileImage');

    return successResponse(review);
  } catch (error: any) {
    console.error('Update review error:', error);
    return errorResponse(error.message || 'Failed to update review', 500);
  }
}

// DELETE review
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Find review
    const review = await Review.findById(id);
    if (!review) {
      return errorResponse('Review not found', 404);
    }

    // Check if user is the review owner
    if (review.userId.toString() !== req.user?.userId) {
      return errorResponse('Unauthorized: You can only delete your own reviews', 403);
    }

    const placeId = review.placeId;

    // Delete review
    await Review.findByIdAndDelete(id);

    // Recalculate place average rating
    const reviews = await Review.find({ placeId });
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    await Place.findByIdAndUpdate(placeId, { averageRating: avgRating });

    return successResponse({ message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    return errorResponse(error.message || 'Failed to delete review', 500);
  }
}

export const GET = authenticate(getHandler);
export const PUT = authenticate(putHandler);
export const DELETE = authenticate(deleteHandler);
