import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Group from '@/lib/models/Group';
import User from '@/lib/models/User';
import Notification from '@/lib/models/Notification';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// POST add member to group (invite)
async function postHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return errorResponse('User ID is required', 400);
    }

    const group = await Group.findById(id);
    if (!group) {
      return errorResponse('Group not found', 404);
    }

    // Check if requester is the creator or already a member
    const isCreator = group.createdBy.toString() === req.user?.userId;
    const isMember = group.members.some((m: any) => m.toString() === req.user?.userId);

    if (!isCreator && !isMember) {
      return errorResponse('Only group members can invite others', 403);
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return errorResponse('User not found', 404);
    }

    // Check if user is already a member
    if (group.members.some((m: any) => m.toString() === userId)) {
      return errorResponse('User is already a member', 400);
    }

    // Add user to group
    group.members.push(userId as any);
    await group.save();

    // Create notification
    await Notification.create({
      userId: userId,
      type: 'group_invite',
      message: `You have been added to the group "${group.name}"`,
      relatedId: group._id,
      relatedModel: 'Group',
    });

    const updatedGroup = await Group.findById(id)
      .populate('createdBy', 'name username profileImage')
      .populate('members', 'name username profileImage');

    return successResponse(updatedGroup);
  } catch (error: any) {
    console.error('Add group member error:', error);
    return errorResponse(error.message || 'Failed to add member', 500);
  }
}

// DELETE remove member from group
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userIdToRemove = searchParams.get('userId');

    if (!userIdToRemove) {
      return errorResponse('User ID is required', 400);
    }

    const group = await Group.findById(id);
    if (!group) {
      return errorResponse('Group not found', 404);
    }

    // Check if requester is the creator
    const isCreator = group.createdBy.toString() === req.user?.userId;

    // Users can remove themselves (leave group) or creator can remove others
    const isSelfRemoval = userIdToRemove === req.user?.userId;

    if (!isCreator && !isSelfRemoval) {
      return errorResponse('Only group creator can remove members', 403);
    }

    // Creator cannot leave their own group
    if (isCreator && isSelfRemoval) {
      return errorResponse('Group creator cannot leave. Transfer ownership or delete the group instead.', 400);
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex((m: any) => m.toString() === userIdToRemove);
    if (memberIndex === -1) {
      return errorResponse('User is not a member of this group', 400);
    }

    // Remove user from group
    group.members.splice(memberIndex, 1);
    await group.save();

    const updatedGroup = await Group.findById(id)
      .populate('createdBy', 'name username profileImage')
      .populate('members', 'name username profileImage');

    return successResponse(updatedGroup);
  } catch (error: any) {
    console.error('Remove group member error:', error);
    return errorResponse(error.message || 'Failed to remove member', 500);
  }
}

export const POST = authenticate(postHandler);
export const DELETE = authenticate(deleteHandler);
