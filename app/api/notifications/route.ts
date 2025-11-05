import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/models/Notification';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET user's notifications
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId: req.user?.userId })
      .populate('fromUserId', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Notification.countDocuments({ userId: req.user?.userId });
    const unreadCount = await Notification.countDocuments({
      userId: req.user?.userId,
      isRead: false,
    });

    return successResponse({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return errorResponse(error.message || 'Failed to get notifications', 500);
  }
}

export const GET = authenticate(getHandler);
