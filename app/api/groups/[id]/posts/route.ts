import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import GroupPost from '@/lib/models/GroupPost';
import Group from '@/lib/models/Group';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { emitToGroup } from '@/lib/socket';

// GET group posts (feed)
async function getHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Check if user is member
    const group = await Group.findById(params.id);
    if (!group) {
      return errorResponse('Group not found', 404);
    }

    if (!group.members.includes(req.user!.userId as any)) {
      return errorResponse('You must be a member to view group posts', 403);
    }

    const posts = await GroupPost.find({ groupId: params.id })
      .populate('userId', 'name username profileImage')
      .populate('likes', 'name username')
      .populate('comments.userId', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await GroupPost.countDocuments({ groupId: params.id });

    return successResponse({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get group posts error:', error);
    return errorResponse(error.message || 'Failed to get group posts', 500);
  }
}

// POST create group post
async function postHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const body = await req.json();
    const { content, images } = body;

    if (!content) {
      return errorResponse('Content is required', 400);
    }

    // Check if user is member
    const group = await Group.findById(params.id);
    if (!group) {
      return errorResponse('Group not found', 404);
    }

    if (!group.members.includes(req.user!.userId as any)) {
      return errorResponse('You must be a member to post in this group', 403);
    }

    const post = await GroupPost.create({
      groupId: params.id,
      userId: req.user!.userId,
      content,
      images: images || [],
    });

    await post.populate('userId', 'name username profileImage');

    // Emit real-time post
    try {
      emitToGroup(params.id, 'new-post', {
        post,
      });
    } catch (socketError) {
      console.log('Socket.io not available, skipping real-time post');
    }

    return successResponse(post, 201);
  } catch (error: any) {
    console.error('Create group post error:', error);
    return errorResponse(error.message || 'Failed to create post', 500);
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);
