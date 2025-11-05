import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import FriendRequest from '@/lib/models/FriendRequest';
import Notification from '@/lib/models/Notification';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { emitToUser } from '@/lib/socket';

// GET user's friends
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const user = await User.findById(req.user?.userId).populate(
      'friends',
      'name username profileImage bio'
    );

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({ friends: user.friends, count: user.friends.length });
  } catch (error: any) {
    console.error('Get friends error:', error);
    return errorResponse(error.message || 'Failed to get friends', 500);
  }
}

// POST send friend request
async function postHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { toUserId } = body;

    if (!toUserId) {
      return errorResponse('User ID is required', 400);
    }

    const fromUserId = req.user?.userId;

    // Check if trying to add self
    if (fromUserId === toUserId) {
      return errorResponse('Cannot send friend request to yourself', 400);
    }

    // Check if users exist
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId),
    ]);

    if (!toUser) {
      return errorResponse('User not found', 404);
    }

    // Check if already friends
    if (fromUser?.friends.includes(toUserId as any)) {
      return errorResponse('Already friends', 400);
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId },
      ],
      status: 'pending',
    });

    if (existingRequest) {
      return errorResponse('Friend request already exists', 400);
    }

    // Create friend request
    const friendRequest = await FriendRequest.create({
      fromUserId,
      toUserId,
      status: 'pending',
    });

    // Create notification
    const notification = await Notification.create({
      userId: toUserId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${fromUser?.name} sent you a friend request`,
      relatedId: friendRequest._id,
      relatedModel: 'FriendRequest',
      fromUserId,
    });

    // Emit real-time notification
    try {
      emitToUser(toUserId, 'notification', {
        type: 'friend_request',
        notification,
      });
    } catch (socketError) {
      console.log('Socket.io not available, skipping real-time notification');
    }

    return successResponse({ friendRequest, message: 'Friend request sent' }, 201);
  } catch (error: any) {
    console.error('Send friend request error:', error);
    return errorResponse(error.message || 'Failed to send friend request', 500);
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);
