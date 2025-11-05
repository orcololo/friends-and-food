import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Place from '@/lib/models/Place';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET places with advanced filtering and sorting
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filters
    const cuisine = searchParams.get('cuisine');
    const priceRange = searchParams.get('priceRange');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const maxRating = parseFloat(searchParams.get('maxRating') || '5');

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, name, averageRating, priceRange
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build query
    const query: any = {};

    if (cuisine) {
      query.cuisine = { $regex: new RegExp(cuisine, 'i') };
    }

    if (priceRange) {
      const ranges = priceRange.split(',').map(Number);
      query.priceRange = { $in: ranges };
    }

    if (minRating > 0 || maxRating < 5) {
      query.averageRating = {
        $gte: minRating,
        $lte: maxRating,
      };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder;

    const places = await Place.find(query)
      .populate('createdBy', 'name username profileImage')
      .sort(sort)
      .limit(limit)
      .skip(skip);

    const total = await Place.countDocuments(query);

    // Get available cuisines for filter options
    const cuisines = await Place.distinct('cuisine');

    return successResponse({
      places,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        availableCuisines: cuisines.sort(),
        appliedFilters: {
          cuisine: cuisine || null,
          priceRange: priceRange || null,
          minRating,
          maxRating,
        },
      },
      sorting: {
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc',
      },
    });
  } catch (error: any) {
    console.error('Filter places error:', error);
    return errorResponse(error.message || 'Failed to filter places', 500);
  }
}

export const GET = authenticate(getHandler);
