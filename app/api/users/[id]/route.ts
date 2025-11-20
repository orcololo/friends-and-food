import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Post from '@/lib/models/Post';
import Review from '@/lib/models/Review';
import Event from '@/lib/models/Event';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET user profile by ID or username
async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    // Try to find by ID first, then by username
    let user = await User.findById(id)
      .select('-password')
      .populate('friends', 'name username profileImage');

    if (!user) {
      user = await User.findOne({ username: id })
        .select('-password')
        .populate('friends', 'name username profileImage');
    }

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Get user's posts, reviews, and organized events
    const [posts, reviews, events] = await Promise.all([
      Post.find({ userId: user._id })
        .populate('placeId', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      Review.find({ userId: user._id })
        .populate('placeId', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      Event.find({ organizer: user._id })
        .populate('placeId', 'name')
        .sort({ date: -1 })
        .limit(10),
    ]);

    const stats = {
      friendsCount: user.friends.length,
      postsCount: posts.length,
      reviewsCount: reviews.length,
      eventsCount: events.length,
    };

    return successResponse({
      user,
      posts,
      reviews,
      events,
      stats,
    });
  } catch (error: any) {
    console.error('Get user profile error:', error);
    return errorResponse(error.message || 'Failed to get user profile', 500);
  }
}

// PUT update user profile
async function putHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    // Users can only update their own profile
    if (id !== req.user?.userId) {
      return errorResponse('Not authorized to update this profile', 403);
    }

    const body = await req.json();
    const { name, bio, profileImage, location } = body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(profileImage !== undefined && { profileImage }),
        ...(location && { location }),
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user);
  } catch (error: any) {
    console.error('Update user profile error:', error);
    return errorResponse(error.message || 'Failed to update profile', 500);
  }
}

export const GET = authenticate(getHandler);
export const PUT = authenticate(putHandler);
