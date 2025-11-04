import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Post from '@/lib/models/Post';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET all posts
async function getHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('userId', 'name username profileImage')
      .populate('placeId', 'name address')
      .populate('likes', 'name username')
      .populate('comments.userId', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Post.countDocuments();

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
    console.error('Get posts error:', error);
    return errorResponse(error.message || 'Failed to get posts', 500);
  }
}

// POST create new post
async function postHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { content, images, placeId } = body;

    // Validate required fields
    if (!content) {
      return errorResponse('Content is required', 400);
    }

    // Create new post
    const post = await Post.create({
      userId: req.user?.userId,
      content,
      images: images || [],
      placeId: placeId || undefined,
    });

    await post.populate([
      { path: 'userId', select: 'name username profileImage' },
      { path: 'placeId', select: 'name address' },
    ]);

    return successResponse(post, 201);
  } catch (error: any) {
    console.error('Create post error:', error);
    return errorResponse(error.message || 'Failed to create post', 500);
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);
