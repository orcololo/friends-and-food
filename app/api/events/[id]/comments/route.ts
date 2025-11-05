import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import EventComment from '@/lib/models/EventComment';
import Event from '@/lib/models/Event';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { emitToEvent } from '@/lib/socket';

// GET comments for an event
async function getHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const comments = await EventComment.find({ eventId: params.id })
      .populate('userId', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(100);

    return successResponse({
      comments,
      count: comments.length,
    });
  } catch (error: any) {
    console.error('Get event comments error:', error);
    return errorResponse(error.message || 'Failed to get comments', 500);
  }
}

// POST add a comment
async function postHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return errorResponse('Content is required', 400);
    }

    // Check if event exists
    const event = await Event.findById(params.id);
    if (!event) {
      return errorResponse('Event not found', 404);
    }

    const comment = await EventComment.create({
      eventId: params.id,
      userId: req.user!.userId,
      content,
    });

    await comment.populate('userId', 'name username profileImage');

    // Emit real-time comment
    try {
      emitToEvent(params.id, 'new-comment', {
        comment,
      });
    } catch (socketError) {
      console.log('Socket.io not available, skipping real-time comment');
    }

    return successResponse(comment, 201);
  } catch (error: any) {
    console.error('Add event comment error:', error);
    return errorResponse(error.message || 'Failed to add comment', 500);
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);
