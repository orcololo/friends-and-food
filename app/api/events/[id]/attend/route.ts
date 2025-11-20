import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Event from '@/lib/models/Event';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// POST attend event (RSVP)
async function postHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const event = await Event.findById(id);

    if (!event) {
      return errorResponse('Event not found', 404);
    }

    const userId = req.user?.userId;

    // Check if already attending
    if (event.attendees.includes(userId as any)) {
      return errorResponse('Already attending this event', 400);
    }

    // Add user to attendees
    event.attendees.push(userId as any);
    await event.save();

    await event.populate([
      { path: 'organizer', select: 'name username profileImage' },
      { path: 'placeId', select: 'name address cuisine' },
      { path: 'attendees', select: 'name username profileImage' },
    ]);

    return successResponse(event);
  } catch (error: any) {
    console.error('Attend event error:', error);
    return errorResponse(error.message || 'Failed to attend event', 500);
  }
}

// DELETE unattend event
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const event = await Event.findById(id);

    if (!event) {
      return errorResponse('Event not found', 404);
    }

    const userId = req.user?.userId;

    // Check if user is the organizer
    if (event.organizer.toString() === userId) {
      return errorResponse('Organizer cannot leave the event', 400);
    }

    // Remove user from attendees
    event.attendees = event.attendees.filter((id) => id.toString() !== userId);
    await event.save();

    await event.populate([
      { path: 'organizer', select: 'name username profileImage' },
      { path: 'placeId', select: 'name address cuisine' },
      { path: 'attendees', select: 'name username profileImage' },
    ]);

    return successResponse(event);
  } catch (error: any) {
    console.error('Unattend event error:', error);
    return errorResponse(error.message || 'Failed to unattend event', 500);
  }
}

export const POST = authenticate(postHandler);
export const DELETE = authenticate(deleteHandler);
