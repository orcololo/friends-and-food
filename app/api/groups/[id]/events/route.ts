import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Event from '@/lib/models/Event';
import Group from '@/lib/models/Group';
import Place from '@/lib/models/Place';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET group events
async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    // Check if user is member
    const group = await Group.findById(id);
    if (!group) {
      return errorResponse('Group not found', 404);
    }

    if (!group.members.includes(req.user!.userId as any)) {
      return errorResponse('You must be a member to view group events', 403);
    }

    // Find events where organizer is a group member
    const events = await Event.find({
      organizer: { $in: group.members },
    })
      .populate('organizer', 'name username profileImage')
      .populate('placeId', 'name address cuisine')
      .populate('attendees', 'name username profileImage')
      .sort({ date: 1 })
      .limit(50);

    return successResponse({
      events,
      count: events.length,
    });
  } catch (error: any) {
    console.error('Get group events error:', error);
    return errorResponse(error.message || 'Failed to get group events', 500);
  }
}

// POST create group event
async function postHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const body = await req.json();
    const { title, description, placeId, date, time } = body;

    if (!title || !placeId || !date || !time) {
      return errorResponse('Title, place, date, and time are required', 400);
    }

    // Check if user is member
    const group = await Group.findById(id);
    if (!group) {
      return errorResponse('Group not found', 404);
    }

    if (!group.members.includes(req.user!.userId as any)) {
      return errorResponse('You must be a member to create group events', 403);
    }

    // Get place to copy location
    const place = await Place.findById(placeId);
    if (!place) {
      return errorResponse('Place not found', 404);
    }

    // Create event with all group members as attendees
    const event = await Event.create({
      title,
      description,
      placeId,
      organizer: req.user!.userId,
      attendees: group.members, // All group members are invited
      date,
      time,
      location: place.location,
    });

    await event.populate([
      { path: 'organizer', select: 'name username profileImage' },
      { path: 'placeId', select: 'name address cuisine' },
      { path: 'attendees', select: 'name username profileImage' },
    ]);

    return successResponse(event, 201);
  } catch (error: any) {
    console.error('Create group event error:', error);
    return errorResponse(error.message || 'Failed to create group event', 500);
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);
