import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Group from '@/lib/models/Group';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET discover public groups
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Find only public groups that user is not a member of
    const groups = await Group.find({
      isPrivate: false,
      members: { $ne: req.user?.userId },
    })
      .populate('createdBy', 'name username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Group.countDocuments({
      isPrivate: false,
      members: { $ne: req.user?.userId },
    });

    return successResponse({
      groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Discover groups error:', error);
    return errorResponse(error.message || 'Failed to discover groups', 500);
  }
}

export const GET = authenticate(getHandler);
