import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Event from '@/lib/models/Event';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET events with advanced filtering and sorting
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status'); // upcoming, ongoing, completed, cancelled
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const myEvents = searchParams.get('myEvents') === 'true'; // Events I'm attending

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'date'; // date, createdAt, title
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;

    // Build query
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    if (myEvents) {
      query.attendees = req.user!.userId;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder;

    const events = await Event.find(query)
      .populate('organizer', 'name username profileImage')
      .populate('placeId', 'name address cuisine')
      .populate('attendees', 'name username profileImage')
      .sort(sort)
      .limit(limit)
      .skip(skip);

    const total = await Event.countDocuments(query);

    return successResponse({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        appliedFilters: {
          status: status || null,
          startDate: startDate || null,
          endDate: endDate || null,
          myEvents,
        },
      },
      sorting: {
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc',
      },
    });
  } catch (error: any) {
    console.error('Filter events error:', error);
    return errorResponse(error.message || 'Failed to filter events', 500);
  }
}

export const GET = authenticate(getHandler);
