import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Group from '@/lib/models/Group';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET user's groups
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const userId = req.user?.userId;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Group.countDocuments({
      $or: [{ createdBy: userId }, { members: userId }],
    });

    // Get paginated groups
    const groups = await Group.find({
      $or: [{ createdBy: userId }, { members: userId }],
    })
      .populate('createdBy', 'name username profileImage')
      .populate('members', 'name username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
    console.error('Get groups error:', error);
    return errorResponse(error.message || 'Failed to get groups', 500);
  }
}

// POST create new group
async function postHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, description, coverImage, isPrivate } = body;

    // Validate required fields
    if (!name) {
      return errorResponse('Group name is required', 400);
    }

    // Create new group
    const group = await Group.create({
      name,
      description,
      coverImage: coverImage || '',
      isPrivate: isPrivate || false,
      createdBy: req.user?.userId,
      members: [req.user?.userId], // Creator is automatically a member
    });

    await group.populate([
      { path: 'createdBy', select: 'name username profileImage' },
      { path: 'members', select: 'name username profileImage' },
    ]);

    return successResponse(group, 201);
  } catch (error: any) {
    console.error('Create group error:', error);
    return errorResponse(error.message || 'Failed to create group', 500);
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);
