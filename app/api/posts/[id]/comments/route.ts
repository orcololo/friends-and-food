import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import Post from '@/lib/models/Post';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET comments for a post
async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const post = await Post.findById(id)
      .populate('comments.userId', 'name username profileImage')
      .select('comments');

    if (!post) {
      return errorResponse('Post not found', 404);
    }

    // Sort comments by newest first
    const comments = post.comments.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return successResponse({
      comments,
      count: comments.length,
    });
  } catch (error: any) {
    console.error('Get post comments error:', error);
    return errorResponse(error.message || 'Failed to get comments', 500);
  }
}

// POST add a comment to a post
async function postHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return errorResponse('Comment content is required', 400);
    }

    if (content.length > 1000) {
      return errorResponse('Comment is too long (max 1000 characters)', 400);
    }

    // Find the post and add comment
    const post = await Post.findById(id);
    if (!post) {
      return errorResponse('Post not found', 404);
    }

    // Add comment to post
    const newComment = {
      userId: new mongoose.Types.ObjectId(req.user!.userId),
      content: content.trim(),
      createdAt: new Date(),
    };

    post.comments.push(newComment as any);
    await post.save();

    // Populate the new comment's user data
    await post.populate('comments.userId', 'name username profileImage');

    // Get the newly added comment (last one)
    const addedComment = post.comments[post.comments.length - 1];

    return successResponse(
      {
        comment: addedComment,
        message: 'Comment added successfully',
      },
      201
    );
  } catch (error: any) {
    console.error('Add post comment error:', error);
    return errorResponse(error.message || 'Failed to add comment', 500);
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);
