import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// DELETE remove friend
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const friendId = params.id;
    const userId = req.user?.userId;

    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId),
    ]);

    if (!friend) {
      return errorResponse('User not found', 404);
    }

    // Remove from both friends lists
    if (user) {
      user.friends = user.friends.filter((id) => id.toString() !== friendId);
      await user.save();
    }

    if (friend) {
      friend.friends = friend.friends.filter((id) => id.toString() !== userId);
      await friend.save();
    }

    return successResponse({ message: 'Friend removed successfully' });
  } catch (error: any) {
    console.error('Remove friend error:', error);
    return errorResponse(error.message || 'Failed to remove friend', 500);
  }
}

export const DELETE = authenticate(deleteHandler);
