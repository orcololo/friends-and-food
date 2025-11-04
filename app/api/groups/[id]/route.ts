import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Group from '@/lib/models/Group';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET single group by ID
async function getHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const group = await Group.findById(params.id)
      .populate('createdBy', 'name username profileImage')
      .populate('members', 'name username profileImage');

    if (!group) {
      return errorResponse('Group not found', 404);
    }

    return successResponse(group);
  } catch (error: any) {
    console.error('Get group error:', error);
    return errorResponse(error.message || 'Failed to get group', 500);
  }
}

// PUT update group
async function putHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const group = await Group.findById(params.id);

    if (!group) {
      return errorResponse('Group not found', 404);
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== req.user?.userId) {
      return errorResponse('Not authorized to update this group', 403);
    }

    const body = await req.json();
    const updatedGroup = await Group.findByIdAndUpdate(params.id, body, { new: true })
      .populate('createdBy', 'name username profileImage')
      .populate('members', 'name username profileImage');

    return successResponse(updatedGroup);
  } catch (error: any) {
    console.error('Update group error:', error);
    return errorResponse(error.message || 'Failed to update group', 500);
  }
}

export const GET = authenticate(getHandler);
export const PUT = authenticate(putHandler);
