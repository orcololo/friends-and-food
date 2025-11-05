import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Post from '@/lib/models/Post';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET single post
async function getHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const post = await Post.findById(params.id)
      .populate('userId', 'name username profileImage')
      .populate('placeId', 'name address')
      .populate('likes', 'name username')
      .populate('comments.userId', 'name username profileImage');

    if (!post) {
      return errorResponse('Post not found', 404);
    }

    return successResponse({ post });
  } catch (error: any) {
    console.error('Get post error:', error);
    return errorResponse(error.message || 'Failed to get post', 500);
  }
}

// PUT update post
async function putHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const post = await Post.findById(params.id);

    if (!post) {
      return errorResponse('Post not found', 404);
    }

    // Check ownership
    if (post.userId.toString() !== req.user?.userId) {
      return errorResponse('You can only edit your own posts', 403);
    }

    // Check if post is still editable (within 15 minutes)
    const fifteenMinutes = 15 * 60 * 1000;
    const postAge = Date.now() - new Date(post.createdAt).getTime();
    if (postAge > fifteenMinutes) {
      return errorResponse('Posts can only be edited within 15 minutes of creation', 403);
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return errorResponse('Content is required', 400);
    }

    if (content.length > 1000) {
      return errorResponse('Content is too long (max 1000 characters)', 400);
    }

    // Update post
    post.content = content;
    post.editedAt = new Date();
    await post.save();

    await post.populate([
      { path: 'userId', select: 'name username profileImage' },
      { path: 'placeId', select: 'name address' },
      { path: 'likes', select: 'name username' },
      { path: 'comments.userId', select: 'name username profileImage' },
    ]);

    return successResponse({ post, message: 'Post updated successfully' });
  } catch (error: any) {
    console.error('Update post error:', error);
    return errorResponse(error.message || 'Failed to update post', 500);
  }
}

// DELETE post
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const post = await Post.findById(params.id);

    if (!post) {
      return errorResponse('Post not found', 404);
    }

    // Check ownership
    if (post.userId.toString() !== req.user?.userId) {
      return errorResponse('You can only delete your own posts', 403);
    }

    // Delete the post (comments are embedded, so they're automatically deleted)
    await Post.findByIdAndDelete(params.id);

    return successResponse({ message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return errorResponse(error.message || 'Failed to delete post', 500);
  }
}

export const GET = authenticate(getHandler);
export const PUT = authenticate(putHandler);
export const DELETE = authenticate(deleteHandler);
