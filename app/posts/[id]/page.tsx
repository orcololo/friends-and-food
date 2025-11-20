'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, ArrowLeft, Send, Trash2 } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/utils/api';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
} from '@/lib/utils/animations';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadPost();
    loadComments();
  }, [isAuthenticated, authLoading, router, resolvedParams.id]);

  const loadPost = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPost(resolvedParams.id);
      setPost(response.data.post);
    } catch (error: any) {
      showToast(error.message || 'Failed to load post', 'error');
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await api.getPostComments(resolvedParams.id);
      setComments(response.data.comments || []);
    } catch (error: any) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleLike = async () => {
    if (!post) return;

    const isLiked = post.likes?.some((like: any) =>
      like && ((like._id || like) === user?.id)
    );

    // Optimistic update
    setPost({
      ...post,
      likes: isLiked
        ? post.likes.filter((like: any) => (like._id || like) !== user?.id)
        : [...(post.likes || []), user?.id],
    });

    try {
      if (isLiked) {
        await api.unlikePost(resolvedParams.id);
      } else {
        await api.likePost(resolvedParams.id);
      }
    } catch (error: any) {
      // Revert on error
      showToast(error.message || 'Failed to update like', 'error');
      loadPost();
    }
  };

  const handleAddComment = async () => {
    if (!commentContent.trim()) {
      showToast('Please enter a comment', 'warning');
      return;
    }

    try {
      setIsSubmittingComment(true);
      const response = await api.addPostComment(resolvedParams.id, commentContent);
      setComments([response.data.comment, ...comments]);
      setCommentContent('');
      showToast('Comment added!', 'success');

      // Update post comment count
      if (post) {
        setPost({
          ...post,
          comments: [...(post.comments || []), response.data.comment],
        });
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to add comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post on Friends & Food',
          text: post?.content.substring(0, 100) + '...',
          url: url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.deletePost(resolvedParams.id);
      showToast('Post deleted successfully', 'success');
      router.push('/dashboard');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete post', 'error');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Loader size="lg" text="Loading post..." fullScreen={false} />
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  const isLiked = post.likes?.some((like: any) =>
    like && ((like._id || like) === user?.id)
  );

  const isAuthor = post.userId?._id === user?.id || post.userId === user?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Back Button */}
          <motion.div variants={staggerItem}>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </motion.div>

          {/* Post Card */}
          <motion.div variants={staggerItem}>
            <Card padding="lg">
              {/* Author Info */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={() => router.push(`/profile/${post.userId?.username || post.userId}`)}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {post.userId?.profileImage ? (
                      <img
                        src={post.userId.profileImage}
                        alt={post.userId.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      post.userId?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {post.userId?.name || 'Unknown User'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      @{post.userId?.username || 'unknown'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(post.createdAt).toLocaleString()}
                      {post.editedAt && <span className="italic"> (edited)</span>}
                    </p>
                  </div>
                </div>

                {isAuthor && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDeletePost}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                )}
              </div>

              {/* Post Content */}
              <p className="text-gray-800 text-lg leading-relaxed mb-6 whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Place Reference */}
              {post.placeId && (
                <div
                  className="mb-6 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => router.push(`/places/${post.placeId._id || post.placeId}`)}
                >
                  <p className="text-sm text-gray-600 mb-1">Posted about</p>
                  <p className="font-semibold text-gray-800">
                    {post.placeId.name || 'Unknown Place'}
                  </p>
                  {post.placeId.address && (
                    <p className="text-sm text-gray-600">{post.placeId.address}</p>
                  )}
                </div>
              )}

              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="mb-6 grid grid-cols-2 gap-2">
                  {post.images.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-6 pt-4 border-t">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  className={`flex items-center space-x-2 transition-colors ${
                    isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500' : ''}`} />
                  <span className="font-medium">{post.likes?.length || 0}</span>
                </motion.button>

                <div className="flex items-center space-x-2 text-gray-600">
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-medium">{post.comments?.length || 0}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors"
                >
                  <Share2 className="w-6 h-6" />
                </motion.button>
              </div>
            </Card>
          </motion.div>

          {/* Comments Section */}
          <motion.div variants={staggerItem}>
            <Card padding="lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Comments ({comments.length})
              </h3>

              {/* Add Comment */}
              <div className="mb-6">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {commentContent.length}/1000
                  </span>
                  <Button
                    onClick={handleAddComment}
                    isLoading={isSubmittingComment}
                    disabled={!commentContent.trim() || isSubmittingComment}
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <AnimatePresence>
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment, index) => (
                      <motion.div
                        key={comment._id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer"
                            onClick={() => router.push(`/profile/${comment.userId?.username || comment.userId}`)}
                          >
                            {comment.userId?.profileImage ? (
                              <img
                                src={comment.userId.profileImage}
                                alt={comment.userId.name}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              comment.userId?.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-semibold text-gray-800 text-sm">
                                {comment.userId?.name || 'Unknown'}
                              </p>
                              <span className="text-gray-400 text-xs">•</span>
                              <p className="text-gray-500 text-xs">
                                {new Date(comment.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-gray-700 text-sm">{comment.content}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
