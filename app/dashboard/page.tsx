'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Calendar, Users, TrendingUp, Clock, Trash2, Edit3, Share2, MoreVertical } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/utils/api';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  pageTransition,
  pulse,
  scaleIn,
} from '@/lib/utils/animations';

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<any>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [userData, postsData, eventsData] = await Promise.all([
        api.getMe(),
        api.getPosts(),
        api.getEvents(1, 5),
      ]);

      setUser(userData.data);
      setPosts(postsData.data.posts);
      setEvents(eventsData.data.events);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      showToast('Please enter some content', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createPost({ content: postContent });
      showToast('Post created successfully!', 'success');
      setPostContent('');
      setShowCreatePostModal(false);
      // Reload posts
      const postsData = await api.getPosts();
      setPosts(postsData.data.posts);
    } catch (error: any) {
      showToast(error.message || 'Failed to create post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      // Check current like state BEFORE optimistic update
      const currentPost = posts.find((p) => p._id === postId);
      const isLiked = currentPost?.likes?.some((like: any) =>
        like && (like._id === user?._id || like === user?._id)
      );

      // Optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            const isLiked = post.likes?.some((like: any) =>
              like && (like._id === user?._id || like === user?._id)
            );

            if (isLiked) {
              // Unlike
              return {
                ...post,
                likes: post.likes.filter((like: any) =>
                  like && (like._id || like) !== user?._id
                ),
              };
            } else {
              // Like
              return {
                ...post,
                likes: [...(post.likes || []), user?._id],
              };
            }
          }
          return post;
        })
      );

      // Call API based on ORIGINAL state
      if (isLiked) {
        await api.unlikePost(postId);
      } else {
        await api.likePost(postId);
      }
    } catch (error: any) {
      // Revert on error
      showToast(error.message || 'Failed to update like', 'error');
      const postsData = await api.getPosts();
      setPosts(postsData.data.posts);
    }
  };

  const handleOpenComments = async (post: any) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
    setComments([]);
    setCommentContent('');
    setIsLoadingComments(true);

    try {
      const response = await api.getPostComments(post._id);
      setComments(response.data.comments || []);
    } catch (error: any) {
      showToast(error.message || 'Failed to load comments', 'error');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentContent.trim()) {
      showToast('Please enter a comment', 'warning');
      return;
    }

    if (!selectedPost) return;

    setIsSubmittingComment(true);
    try {
      const response = await api.addPostComment(selectedPost._id, commentContent);

      // Add new comment to list
      setComments((prev) => [response.data.comment, ...prev]);

      // Update post comment count in posts list
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === selectedPost._id) {
            return {
              ...post,
              comments: [...(post.comments || []), response.data.comment],
            };
          }
          return post;
        })
      );

      setCommentContent('');
      showToast('Comment added successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to add comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      await api.deletePost(postToDelete);
      setPosts((prev) => prev.filter((p) => p._id !== postToDelete));
      showToast('Post deleted successfully', 'success');
      setShowDeleteModal(false);
      setPostToDelete(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to delete post', 'error');
    }
  };

  const handleEditPost = async () => {
    if (!postToEdit || !editContent.trim()) {
      showToast('Please enter some content', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.updatePost(postToEdit._id, editContent);
      setPosts((prev) =>
        prev.map((p) => (p._id === postToEdit._id ? { ...p, content: editContent, editedAt: new Date() } : p))
      );
      showToast('Post updated successfully!', 'success');
      setShowEditModal(false);
      setPostToEdit(null);
      setEditContent('');
    } catch (error: any) {
      showToast(error.message || 'Failed to update post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSharePost = async (post: any) => {
    const url = `${window.location.origin}/posts/${post._id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post on Friends & Food',
          text: post.content.substring(0, 100) + '...',
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

  const canEditPost = (post: any) => {
    if (post.userId._id !== user?._id && post.userId !== user?._id) return false;
    const fifteenMinutes = 15 * 60 * 1000;
    const postAge = Date.now() - new Date(post.createdAt).getTime();
    return postAge <= fifteenMinutes;
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
      >
        <motion.div
          className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Here's what's happening in your food community</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <motion.div
            className="lg:col-span-2"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Activity Feed</h2>
              <Button size="sm" onClick={() => setShowCreatePostModal(true)}>Create Post</Button>
            </div>

            <AnimatePresence mode="wait">
              {posts.length === 0 ? (
                <motion.div
                  key="empty"
                  variants={scaleIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Card shadow="lg" padding="lg" background="gradient">
                    <div className="text-center py-12">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
                      </motion.div>
                      <p className="text-gray-500 text-lg mb-2 font-semibold">No posts yet</p>
                      <p className="text-gray-400">Follow friends or create your first post!</p>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="posts"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-4"
                >
                  {posts.map((post, index) => (
                    <motion.div key={post._id} variants={staggerItem}>
                      <Card hover shadow="lg" padding="lg" className="backdrop-blur-sm">
                        <div className="flex items-start space-x-3">
                          <motion.div
                            className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.2 }}
                          >
                            {post.userId?.name?.charAt(0)}
                          </motion.div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-800">{post.userId?.name}</h3>
                                <span className="text-gray-400 text-sm">@{post.userId?.username}</span>
                                {post.editedAt && (
                                  <span className="text-gray-400 text-xs italic">(edited)</span>
                                )}
                              </div>
                              {(post.userId._id === user?._id || post.userId === user?._id) && (
                                <div className="flex items-center space-x-2">
                                  {canEditPost(post) && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        setPostToEdit(post);
                                        setEditContent(post.content);
                                        setShowEditModal(true);
                                      }}
                                      className="text-gray-400 hover:text-blue-500 transition-colors"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </motion.button>
                                  )}
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setPostToDelete(post._id);
                                      setShowDeleteModal(true);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              )}
                            </div>
                            <p className="text-gray-700 mb-3">{post.content}</p>
                            <div className="flex items-center space-x-4 text-gray-500">
                              <motion.button
                                onClick={() => handleLikePost(post._id)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`transition-colors flex items-center space-x-1 ${
                                  post.likes?.some((like: any) =>
                                    like && ((like._id || like) === user?._id)
                                  )
                                    ? 'text-red-500'
                                    : 'hover:text-red-500'
                                }`}
                              >
                                <Heart
                                  className={`w-5 h-5 ${
                                    post.likes?.some((like: any) =>
                                      like && ((like._id || like) === user?._id)
                                    )
                                      ? 'fill-red-500'
                                      : ''
                                  }`}
                                />
                                <span className="font-medium">{post.likes?.length || 0}</span>
                              </motion.button>
                              <motion.button
                                onClick={() => handleOpenComments(post)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="hover:text-blue-500 transition-colors flex items-center space-x-1"
                              >
                                <MessageCircle className="w-5 h-5" />
                                <span className="font-medium">{post.comments?.length || 0}</span>
                              </motion.button>
                              <motion.button
                                onClick={() => handleSharePost(post)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="hover:text-green-500 transition-colors flex items-center space-x-1"
                              >
                                <Share2 className="w-5 h-5" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            {/* Quick Stats */}
            <Card shadow="lg" padding="lg" background="gradient">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-800">Quick Stats</h3>
              </div>
              <div className="space-y-4">
                <motion.div
                  className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                  whileHover={{ scale: 1.02, x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600 font-medium">Friends</span>
                  </div>
                  <motion.span
                    className="font-bold text-orange-500 text-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                  >
                    {user?.friends?.length || 0}
                  </motion.span>
                </motion.div>
                <motion.div
                  className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                  whileHover={{ scale: 1.02, x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600 font-medium">Events</span>
                  </div>
                  <motion.span
                    className="font-bold text-orange-500 text-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                  >
                    {events.length}
                  </motion.span>
                </motion.div>
                <motion.div
                  className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                  whileHover={{ scale: 1.02, x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600 font-medium">Posts</span>
                  </div>
                  <motion.span
                    className="font-bold text-orange-500 text-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                  >
                    {posts.length}
                  </motion.span>
                </motion.div>
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card shadow="lg" padding="lg" background="white">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-800">Upcoming Events</h3>
              </div>
              {events.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <p className="text-gray-500">No upcoming events</p>
                </motion.div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-3"
                >
                  {events.map((event) => (
                    <motion.div
                      key={event._id}
                      variants={staggerItem}
                      whileHover={{ x: 4, scale: 1.02 }}
                      className="border-l-4 border-orange-500 pl-3 py-2 bg-gradient-to-r from-orange-50 to-transparent rounded-r cursor-pointer shadow-sm"
                    >
                      <h4 className="font-medium text-gray-800">{event.title}</h4>
                      <p className="text-sm text-gray-600 font-medium">{event.placeId?.name}</p>
                      <p className="text-xs text-gray-400 flex items-center space-x-1 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                        <span>at</span>
                        <span>{event.time}</span>
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Create Post Modal */}
      <Modal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        title="Create New Post"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="post-content" className="block text-sm font-medium text-gray-700 mb-2">
              What's on your mind?
            </label>
            <textarea
              id="post-content"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Share your thoughts, food experiences, or restaurant recommendations..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {postContent.length}/1000 characters
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCreatePostModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePost}
              isLoading={isSubmitting}
              disabled={isSubmitting || !postContent.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Comments Modal */}
      <Modal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        title="Comments"
        size="lg"
      >
        <div className="space-y-4">
          {/* Original Post */}
          {selectedPost && (
            <Card background="gradient" padding="md">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedPost.userId?.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-gray-800">{selectedPost.userId?.name}</h4>
                    <span className="text-gray-400 text-sm">@{selectedPost.userId?.username}</span>
                  </div>
                  <p className="text-gray-700">{selectedPost.content}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Comment Input */}
          <div>
            <label htmlFor="comment-content" className="block text-sm font-medium text-gray-700 mb-2">
              Add a comment
            </label>
            <textarea
              id="comment-content"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Share your thoughts..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {commentContent.length}/1000 characters
              </span>
              <Button
                size="sm"
                onClick={handleAddComment}
                isLoading={isSubmittingComment}
                disabled={isSubmittingComment || !commentContent.trim()}
              >
                {isSubmittingComment ? 'Posting...' : 'Comment'}
              </Button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoadingComments ? (
              <div className="flex justify-center py-8">
                <motion.div
                  className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <AnimatePresence>
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment._id || index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card padding="sm" className="bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {comment.userId?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="font-semibold text-gray-800 text-sm">
                              {comment.userId?.name}
                            </h5>
                            <span className="text-gray-400 text-xs">
                              @{comment.userId?.username}
                            </span>
                            <span className="text-gray-400 text-xs">•</span>
                            <span className="text-gray-400 text-xs">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Post Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPostToDelete(null);
        }}
        title="Delete Post"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">Are you sure you want to delete this post? This action cannot be undone.</p>
          <div className="flex space-x-3">
            <Button
              onClick={handleDeletePost}
              variant="primary"
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              Delete
            </Button>
            <Button
              onClick={() => {
                setShowDeleteModal(false);
                setPostToDelete(null);
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Post Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setPostToEdit(null);
          setEditContent('');
        }}
        title="Edit Post"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-2">
              Post Content
            </label>
            <textarea
              id="edit-content"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Edit your post..."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {editContent.length}/1000 characters
              </span>
              <span className="text-xs text-gray-400">
                Posts can only be edited within 15 minutes
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleEditPost}
              isLoading={isSubmitting}
              disabled={isSubmitting || !editContent.trim()}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={() => {
                setShowEditModal(false);
                setPostToEdit(null);
                setEditContent('');
              }}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
