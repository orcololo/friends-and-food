import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Message from '@/lib/models/Message';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { emitToUser } from '@/lib/socket';

// Helper to generate conversation ID
function getConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('-');
}

// GET messages for a conversation
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    if (!otherUserId) {
      return errorResponse('User ID is required', 400);
    }

    const conversationId = getConversationId(req.user!.userId, otherUserId);

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name username profileImage')
      .populate('receiverId', 'name username profileImage')
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(skip);

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: req.user?.userId,
        isRead: false,
      },
      { isRead: true }
    );

    const total = await Message.countDocuments({ conversationId });

    return successResponse({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get messages error:', error);
    return errorResponse(error.message || 'Failed to get messages', 500);
  }
}

// POST send a message
async function postHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return errorResponse('Receiver ID and content are required', 400);
    }

    const senderId = req.user!.userId;
    const conversationId = getConversationId(senderId, receiverId);

    const message = await Message.create({
      conversationId,
      senderId,
      receiverId,
      content,
    });

    await message.populate([
      { path: 'senderId', select: 'name username profileImage' },
      { path: 'receiverId', select: 'name username profileImage' },
    ]);

    // Emit real-time message
    try {
      emitToUser(receiverId, 'new-message', {
        message,
        conversationId,
      });
    } catch (socketError) {
      console.log('Socket.io not available, skipping real-time message');
    }

    return successResponse(message, 201);
  } catch (error: any) {
    console.error('Send message error:', error);
    return errorResponse(error.message || 'Failed to send message', 500);
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);
