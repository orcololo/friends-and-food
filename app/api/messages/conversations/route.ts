import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Message from '@/lib/models/Message';
import User from '@/lib/models/User';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET list of conversations
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const userId = req.user!.userId;

    // Get all unique conversations for this user
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', new mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$isRead', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);

    // Populate user details
    const conversations = await Promise.all(
      messages.map(async (conv) => {
        const otherUserId =
          conv.lastMessage.senderId.toString() === userId
            ? conv.lastMessage.receiverId
            : conv.lastMessage.senderId;

        const otherUser = await User.findById(otherUserId).select('name username profileImage');

        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount,
        };
      })
    );

    return successResponse({
      conversations,
      count: conversations.length,
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    return errorResponse(error.message || 'Failed to get conversations', 500);
  }
}

export const GET = authenticate(getHandler);
