import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

async function handler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const user = await User.findById(req.user?.userId)
      .select('-password')
      .populate('friends', 'name username profileImage');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      id: user._id,
      email: user.email,
      name: user.name,
      username: user.username,
      bio: user.bio,
      profileImage: user.profileImage,
      location: user.location,
      friends: user.friends,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return errorResponse(error.message || 'Failed to get user', 500);
  }
}

export const GET = authenticate(handler);
