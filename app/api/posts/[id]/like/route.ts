import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Post from '@/lib/models/Post';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// POST like post
async function postHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const post = await Post.findById(id);

    if (!post) {
      return errorResponse('Post not found', 404);
    }

    const userId = req.user?.userId;

    // Check if already liked
    if (post.likes.includes(userId as any)) {
      return errorResponse('Already liked this post', 400);
    }

    // Add user to likes
    post.likes.push(userId as any);
    await post.save();

    await post.populate([
      { path: 'userId', select: 'name username profileImage' },
      { path: 'placeId', select: 'name address' },
      { path: 'likes', select: 'name username' },
    ]);

    return successResponse(post);
  } catch (error: any) {
    console.error('Like post error:', error);
    return errorResponse(error.message || 'Failed to like post', 500);
  }
}

// DELETE unlike post
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const post = await Post.findById(id);

    if (!post) {
      return errorResponse('Post not found', 404);
    }

    const userId = req.user?.userId;

    // Remove user from likes
    post.likes = post.likes.filter((id) => id.toString() !== userId);
    await post.save();

    await post.populate([
      { path: 'userId', select: 'name username profileImage' },
      { path: 'placeId', select: 'name address' },
      { path: 'likes', select: 'name username' },
    ]);

    return successResponse(post);
  } catch (error: any) {
    console.error('Unlike post error:', error);
    return errorResponse(error.message || 'Failed to unlike post', 500);
  }
}

export const POST = authenticate(postHandler);
export const DELETE = authenticate(deleteHandler);
