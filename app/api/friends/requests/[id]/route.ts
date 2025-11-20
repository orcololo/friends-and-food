import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import FriendRequest from '@/lib/models/FriendRequest';
import Notification from '@/lib/models/Notification';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { emitToUser } from '@/lib/socket';

// PUT accept/reject friend request
async function putHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const body = await req.json();
    const { action } = body; // 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return errorResponse('Invalid action', 400);
    }

    const friendRequest = await FriendRequest.findById(id);

    if (!friendRequest) {
      return errorResponse('Friend request not found', 404);
    }

    // Verify this request is for the current user
    if (friendRequest.toUserId.toString() !== req.user?.userId) {
      return errorResponse('Not authorized', 403);
    }

    if (friendRequest.status !== 'pending') {
      return errorResponse('Friend request already processed', 400);
    }

    friendRequest.status = action === 'accept' ? 'accepted' : 'rejected';
    await friendRequest.save();

    // If accepted, add to friends list
    if (action === 'accept') {
      const [fromUser, toUser] = await Promise.all([
        User.findById(friendRequest.fromUserId),
        User.findById(friendRequest.toUserId),
      ]);

      if (fromUser && toUser) {
        // Add each other as friends
        if (!fromUser.friends.includes(toUser._id as any)) {
          fromUser.friends.push(toUser._id as any);
          await fromUser.save();
        }
        if (!toUser.friends.includes(fromUser._id as any)) {
          toUser.friends.push(fromUser._id as any);
          await toUser.save();
        }

        // Create notification for requester
        const notification = await Notification.create({
          userId: friendRequest.fromUserId,
          type: 'friend_accepted',
          title: 'Friend Request Accepted',
          message: `${toUser.name} accepted your friend request`,
          relatedId: toUser._id,
          relatedModel: 'User',
          fromUserId: toUser._id,
        });

        // Emit real-time notification
        try {
          emitToUser(friendRequest.fromUserId.toString(), 'notification', {
            type: 'friend_accepted',
            notification,
          });
        } catch (socketError) {
          console.log('Socket.io not available, skipping real-time notification');
        }
      }
    }

    return successResponse({
      friendRequest,
      message: action === 'accept' ? 'Friend request accepted' : 'Friend request rejected',
    });
  } catch (error: any) {
    console.error('Update friend request error:', error);
    return errorResponse(error.message || 'Failed to update friend request', 500);
  }
}

export const PUT = authenticate(putHandler);
