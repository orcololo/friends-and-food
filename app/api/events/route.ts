import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Event from '@/lib/models/Event';
import Place from '@/lib/models/Place';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET all events
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const events = await Event.find()
      .populate('organizer', 'name username profileImage')
      .populate('placeId', 'name address cuisine')
      .populate('attendees', 'name username profileImage')
      .sort({ date: 1 })
      .limit(limit)
      .skip(skip);

    const total = await Event.countDocuments();

    return successResponse({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get events error:', error);
    return errorResponse(error.message || 'Failed to get events', 500);
  }
}

// POST create new event
async function postHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { title, description, placeId, date, time } = body;

    // Validate required fields
    if (!title || !placeId || !date || !time) {
      return errorResponse('Title, place, date, and time are required', 400);
    }

    // Get place to copy location
    const place = await Place.findById(placeId);
    if (!place) {
      return errorResponse('Place not found', 404);
    }

    // Create new event
    const event = await Event.create({
      title,
      description,
      placeId,
      organizer: req.user?.userId,
      attendees: [req.user?.userId], // Organizer is automatically attending
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
    console.error('Create event error:', error);
    return errorResponse(error.message || 'Failed to create event', 500);
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);
