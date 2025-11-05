'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Heart, MessageCircle, Star, Calendar, UserCheck, UserPlus, Mail, MapPin, Link as LinkIcon, Trash2, Edit3, Share2 } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/utils/api';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  tabContent,
  scaleIn,
  skeletonPulse,
} from '@/lib/utils/animations';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', bio: '' });
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews' | 'events' | 'friends'>('posts');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<any>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadProfile();
  }, [params.username]);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Load profile
      const profileRes = await fetch(`/api/users/${params.username}`, { headers });
      const profileData = await profileRes.json();

      if (!profileData.success) {
        throw new Error(profileData.message);
      }

      setProfile(profileData.data);

      // Load current user
      const userRes = await fetch('/api/auth/me', { headers });
      const userData = await userRes.json();
      if (userData.success) {
        setCurrentUser(userData.data);
        setEditData({ name: userData.data.name, bio: userData.data.bio || '' });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      setShowEditModal(false);
      loadProfile();
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    }
  };

  const handleAddFriend = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUserId: profile.user._id }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      alert('Friend request sent!');
    } catch (error: any) {
      alert(error.message || 'Failed to send friend request');
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      // Optimistic update
      setProfile((prevProfile: any) => ({
        ...prevProfile,
        posts: prevProfile.posts.map((post: any) => {
          if (post._id === postId) {
            const isLiked = post.likes?.some((like: any) =>
              like._id === currentUser?._id || like === currentUser?._id
            );

            if (isLiked) {
              // Unlike
              return {
                ...post,
                likes: post.likes.filter((like: any) =>
                  (like._id || like) !== currentUser?._id
                ),
              };
            } else {
              // Like
              return {
                ...post,
                likes: [...(post.likes || []), currentUser?._id],
              };
            }
          }
          return post;
        }),
      }));

      // Get current post state to determine action
      const currentPost = profile.posts.find((p: any) => p._id === postId);
      const isLiked = currentPost?.likes?.some((like: any) =>
        like._id === currentUser?._id || like === currentUser?._id
      );

      // Call API
      if (isLiked) {
        await api.unlikePost(postId);
      } else {
        await api.likePost(postId);
      }
    } catch (error: any) {
      // Revert on error
      showToast(error.message || 'Failed to update like', 'error');
      loadProfile();
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

      // Update post comment count in profile
      setProfile((prevProfile: any) => ({
        ...prevProfile,
        posts: prevProfile.posts.map((post: any) => {
          if (post._id === selectedPost._id) {
            return {
              ...post,
              comments: [...(post.comments || []), response.data.comment],
            };
          }
          return post;
        }),
      }));

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
      setProfile((prevProfile: any) => ({
        ...prevProfile,
        posts: prevProfile.posts.filter((p: any) => p._id !== postToDelete),
      }));
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
      await api.updatePost(postToEdit._id, editContent);
      setProfile((prevProfile: any) => ({
        ...prevProfile,
        posts: prevProfile.posts.map((p: any) =>
          p._id === postToEdit._id ? { ...p, content: editContent, editedAt: new Date() } : p
        ),
      }));
      showToast('Post updated successfully!', 'success');
      setShowEditPostModal(false);
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
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  const canEditPost = (post: any) => {
    if (post.userId._id !== currentUser?._id && post.userId !== currentUser?._id) return false;
    const fifteenMinutes = 15 * 60 * 1000;
    const postAge = Date.now() - new Date(post.createdAt).getTime();
    return postAge <= fifteenMinutes;
  };

  // Animated counter
  const AnimatedCounter = ({ value, label }: { value: number; label: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      let start = 0;
      const end = value;
      if (start === end) return;

      const duration = 1000;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, [value]);

    return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
        <span className="font-bold text-gray-800 text-xl">{count}</span>
        <span className="text-gray-600 ml-2">{label}</span>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={skeletonPulse}
            initial="initial"
            animate="animate"
            className="h-48 bg-gray-200 rounded-xl mb-6"
          />
          <div className="space-y-6">
            <motion.div
              variants={skeletonPulse}
              initial="initial"
              animate="animate"
              className="h-16 bg-gray-200 rounded-xl"
            />
            <motion.div
              variants={skeletonPulse}
              initial="initial"
              animate="animate"
              className="h-96 bg-gray-200 rounded-xl"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">User not found</h2>
              <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.user._id;
  const isFriend = currentUser?.friends?.some((f: any) => f._id === profile.user._id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Profile Header with Backdrop Blur */}
          <motion.div variants={staggerItem}>
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border-orange-200">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
              <div className="relative backdrop-blur-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-6 flex-1">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="relative"
                    >
                      <div className="w-32 h-32 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-2xl ring-4 ring-white">
                        {profile.user.name?.charAt(0)}
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white"
                      />
                    </motion.div>
                    <div className="flex-1">
                      <motion.h1
                        variants={fadeInUp}
                        className="text-4xl font-bold text-gray-800 mb-2"
                      >
                        {profile.user.name}
                      </motion.h1>
                      <motion.p
                        variants={fadeInUp}
                        className="text-xl text-gray-600 mb-3"
                      >
                        @{profile.user.username}
                      </motion.p>
                      {profile.user.bio && (
                        <motion.p
                          variants={fadeInUp}
                          className="text-gray-700 mb-4 max-w-2xl leading-relaxed"
                        >
                          {profile.user.bio}
                        </motion.p>
                      )}

                      {/* Animated Stats */}
                      <motion.div
                        variants={staggerContainer}
                        className="flex items-center space-x-8"
                      >
                        <AnimatedCounter value={profile.stats.friendsCount} label="Friends" />
                        <AnimatedCounter value={profile.stats.postsCount} label="Posts" />
                        <AnimatedCounter value={profile.stats.reviewsCount} label="Reviews" />
                        <AnimatedCounter value={profile.stats.eventsCount} label="Events" />
                      </motion.div>
                    </div>
                  </div>

                  <motion.div variants={scaleIn} className="flex items-center space-x-2">
                    {isOwnProfile ? (
                      <Button onClick={() => setShowEditModal(true)}>Edit Profile</Button>
                    ) : (
                      <>
                        <AnimatePresence mode="wait">
                          {isFriend ? (
                            <motion.div
                              key="friend"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                            >
                              <Button variant="outline">
                                <UserCheck className="w-4 h-4 mr-2" />
                                Friends
                              </Button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="not-friend"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                            >
                              <Button onClick={handleAddFriend}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Friend
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <Button variant="outline">
                          <Mail className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </>
                    )}
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Tabs with Animated Underline */}
          <motion.div variants={staggerItem}>
            <Card>
              <div className="flex space-x-6 border-b relative">
                {(['posts', 'reviews', 'events', 'friends'] as const).map((tab) => (
                  <motion.button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 px-4 capitalize relative transition-colors ${
                      activeTab === tab
                        ? 'text-orange-500 font-semibold'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Tab Content with Smooth Transitions */}
          <AnimatePresence mode="wait">
            {activeTab === 'posts' && (
              <motion.div
                key="posts"
                variants={tabContent}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                {profile.posts && profile.posts.length > 0 ? (
                  <motion.div variants={staggerContainer} className="space-y-4">
                    {profile.posts.map((post: any, index: number) => (
                      <motion.div key={post._id} variants={staggerItem} custom={index}>
                        <Card hover>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                              {post.editedAt && (
                                <span className="text-gray-400 text-xs italic">(edited)</span>
                              )}
                            </div>
                            {isOwnProfile && (
                              <div className="flex items-center space-x-2">
                                {canEditPost(post) && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setPostToEdit(post);
                                      setEditContent(post.content);
                                      setShowEditPostModal(true);
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
                          <p className="text-gray-700 mb-3 leading-relaxed">{post.content}</p>
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <motion.button
                              onClick={() => handleLikePost(post._id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className={`transition-colors flex items-center space-x-2 ${
                                post.likes?.some((like: any) =>
                                  (like._id || like) === currentUser?._id
                                )
                                  ? 'text-red-500'
                                  : 'hover:text-red-500'
                              }`}
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  post.likes?.some((like: any) =>
                                    (like._id || like) === currentUser?._id
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
                              className="hover:text-blue-500 transition-colors flex items-center space-x-2"
                            >
                              <MessageCircle className="w-5 h-5" />
                              <span className="font-medium">{post.comments?.length || 0}</span>
                            </motion.button>
                            <motion.button
                              onClick={() => handleSharePost(post)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="hover:text-green-500 transition-colors flex items-center space-x-2"
                            >
                              <Share2 className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div variants={fadeInUp}>
                    <Card>
                      <div className="text-center py-12">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No posts yet</p>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                variants={tabContent}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                {profile.reviews && profile.reviews.length > 0 ? (
                profile.reviews.map((review: any) => (
                  <Card key={review._id} hover>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{review.placeId?.name}</p>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'fill-gray-300 text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && <p className="text-gray-700">{review.comment}</p>}
                  </Card>
                ))
              ) : (
                <Card>
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reviews yet</p>
                  </div>
                </Card>
                )}
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div
                key="events"
                variants={tabContent}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
              {profile.events && profile.events.length > 0 ? (
                profile.events.map((event: any) => (
                  <Card key={event._id} hover>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-10 h-10 text-orange-500" strokeWidth={1.5} />
                      <div>
                        <p className="font-semibold text-gray-800">{event.title}</p>
                        <p className="text-sm text-gray-600">{event.placeId?.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString()} at {event.time}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <div className="text-center py-8">
                    <p className="text-gray-500">No events organized yet</p>
                  </div>
                </Card>
                )}
              </motion.div>
            )}

            {activeTab === 'friends' && (
              <motion.div
                key="friends"
                variants={tabContent}
                initial="initial"
                animate="animate"
                exit="exit"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
              {profile.user.friends && profile.user.friends.length > 0 ? (
                profile.user.friends.map((friend: any) => (
                  <Card
                    key={friend._id}
                    hover
                    className="cursor-pointer"
                    onClick={() => router.push(`/profile/${friend.username}`)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">
                        {friend.name?.charAt(0)}
                      </div>
                      <p className="font-medium text-gray-800">{friend.name}</p>
                      <p className="text-sm text-gray-500">@{friend.username}</p>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card>
                    <div className="text-center py-8">
                      <p className="text-gray-500">No friends yet</p>
                    </div>
                  </Card>
                </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={4}
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleEditProfile} className="flex-1">
              Save Changes
            </Button>
            <Button
              onClick={() => setShowEditModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
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
        isOpen={showEditPostModal}
        onClose={() => {
          setShowEditPostModal(false);
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
                setShowEditPostModal(false);
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
    </div>
  );
}
