import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Place from '@/lib/models/Place';
import Event from '@/lib/models/Event';
import Group from '@/lib/models/Group';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET search across all resources
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, users, places, events, groups
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return errorResponse('Search query must be at least 2 characters', 400);
    }

    const searchRegex = new RegExp(query, 'i');
    const results: any = {};

    // Search users
    if (type === 'all' || type === 'users') {
      const users = await User.find({
        $or: [
          { name: searchRegex },
          { username: searchRegex },
        ],
      })
        .select('name username profileImage bio')
        .limit(limit);

      results.users = users;
    }

    // Search places
    if (type === 'all' || type === 'places') {
      const places = await Place.find({
        $or: [
          { name: searchRegex },
          { cuisine: searchRegex },
          { address: searchRegex },
        ],
      })
        .populate('createdBy', 'name username')
        .limit(limit);

      results.places = places;
    }

    // Search events
    if (type === 'all' || type === 'events') {
      const events = await Event.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
        ],
      })
        .populate('organizer', 'name username')
        .populate('placeId', 'name')
        .limit(limit);

      results.events = events;
    }

    // Search groups
    if (type === 'all' || type === 'groups') {
      const groups = await Group.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
        ],
      })
        .populate('createdBy', 'name username')
        .limit(limit);

      results.groups = groups;
    }

    return successResponse({
      query,
      results,
      counts: {
        users: results.users?.length || 0,
        places: results.places?.length || 0,
        events: results.events?.length || 0,
        groups: results.groups?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return errorResponse(error.message || 'Search failed', 500);
  }
}

export const GET = authenticate(getHandler);
