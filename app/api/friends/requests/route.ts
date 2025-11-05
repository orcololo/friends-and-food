import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import FriendRequest from '@/lib/models/FriendRequest';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET friend requests (received)
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const requests = await FriendRequest.find({
      toUserId: req.user?.userId,
      status: 'pending',
    })
      .populate('fromUserId', 'name username profileImage bio')
      .sort({ createdAt: -1 });

    return successResponse({ requests, count: requests.length });
  } catch (error: any) {
    console.error('Get friend requests error:', error);
    return errorResponse(error.message || 'Failed to get friend requests', 500);
  }
}

export const GET = authenticate(getHandler);
