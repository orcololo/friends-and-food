import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/models/Notification';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// PUT mark notification as read
async function putHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const notification = await Notification.findOne({
      _id: params.id,
      userId: req.user?.userId,
    });

    if (!notification) {
      return errorResponse('Notification not found', 404);
    }

    notification.isRead = true;
    await notification.save();

    return successResponse(notification);
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return errorResponse(error.message || 'Failed to mark notification as read', 500);
  }
}

// DELETE notification
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const notification = await Notification.findOneAndDelete({
      _id: params.id,
      userId: req.user?.userId,
    });

    if (!notification) {
      return errorResponse('Notification not found', 404);
    }

    return successResponse({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    return errorResponse(error.message || 'Failed to delete notification', 500);
  }
}

export const PUT = authenticate(putHandler);
export const DELETE = authenticate(deleteHandler);
