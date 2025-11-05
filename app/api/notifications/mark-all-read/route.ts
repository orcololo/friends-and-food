import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/models/Notification';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// PUT mark all notifications as read
async function putHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    await Notification.updateMany(
      { userId: req.user?.userId, isRead: false },
      { isRead: true }
    );

    return successResponse({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all notifications read error:', error);
    return errorResponse(error.message || 'Failed to mark all notifications as read', 500);
  }
}

export const PUT = authenticate(putHandler);
