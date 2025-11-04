import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Event from '@/lib/models/Event';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET single event by ID
async function getHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const event = await Event.findById(params.id)
      .populate('organizer', 'name username profileImage')
      .populate('placeId', 'name address cuisine images location')
      .populate('attendees', 'name username profileImage');

    if (!event) {
      return errorResponse('Event not found', 404);
    }

    return successResponse(event);
  } catch (error: any) {
    console.error('Get event error:', error);
    return errorResponse(error.message || 'Failed to get event', 500);
  }
}

// PUT update event
async function putHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const event = await Event.findById(params.id);

    if (!event) {
      return errorResponse('Event not found', 404);
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user?.userId) {
      return errorResponse('Not authorized to update this event', 403);
    }

    const body = await req.json();
    const updatedEvent = await Event.findByIdAndUpdate(params.id, body, { new: true })
      .populate('organizer', 'name username profileImage')
      .populate('placeId', 'name address cuisine')
      .populate('attendees', 'name username profileImage');

    return successResponse(updatedEvent);
  } catch (error: any) {
    console.error('Update event error:', error);
    return errorResponse(error.message || 'Failed to update event', 500);
  }
}

// DELETE event
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const event = await Event.findById(params.id);

    if (!event) {
      return errorResponse('Event not found', 404);
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user?.userId) {
      return errorResponse('Not authorized to delete this event', 403);
    }

    await Event.findByIdAndDelete(params.id);

    return successResponse({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Delete event error:', error);
    return errorResponse(error.message || 'Failed to delete event', 500);
  }
}

export const GET = authenticate(getHandler);
export const PUT = authenticate(putHandler);
export const DELETE = authenticate(deleteHandler);
