'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, UserMinus, Check, X } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Loader from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/utils/api';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
} from '@/lib/utils/animations';

type TabType = 'friends' | 'requests';

interface Friend {
  _id: string;
  name: string;
  username: string;
  profileImage?: string;
  bio?: string;
}

interface FriendRequest {
  _id: string;
  fromUserId: {
    _id: string;
    name: string;
    username: string;
    profileImage?: string;
    bio?: string;
  };
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function FriendsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadFriends();
    loadFriendRequests();
  }, [isAuthenticated, authLoading, router]);

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      const response = await api.getFriends();
      setFriends(response.data.friends || []);
    } catch (error: any) {
      showToast(error.message || 'Failed to load friends', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await api.getFriendRequests();
      setFriendRequests(response.data.requests || []);
    } catch (error: any) {
      console.error('Failed to load friend requests:', error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      await api.removeFriend(friendId);
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      showToast('Friend removed', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to remove friend', 'error');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId);
      setFriendRequests((prev) => prev.filter((r) => r._id !== requestId));
      showToast('Friend request accepted!', 'success');
      loadFriends(); // Reload friends list
    } catch (error: any) {
      showToast(error.message || 'Failed to accept request', 'error');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.rejectFriendRequest(requestId);
      setFriendRequests((prev) => prev.filter((r) => r._id !== requestId));
      showToast('Friend request rejected', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to reject request', 'error');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Loader size="lg" text="Loading friends..." fullScreen={false} />
        </div>
      </div>
    );
  }

  const pendingRequests = friendRequests.filter((r) => r.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={staggerItem} className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
                <Users className="w-10 h-10 mr-3 text-orange-500" />
                Friends
              </h1>
              <p className="text-gray-600">
                {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
                {pendingRequests.length > 0 && ` • ${pendingRequests.length} pending request${pendingRequests.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <Button onClick={() => router.push('/search')}>
              <UserPlus className="w-4 h-4 mr-2" />
              Find Friends
            </Button>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={staggerItem}>
            <Card>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'friends'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Friends ({friends.length})
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all relative ${
                    activeTab === 'requests'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Requests ({pendingRequests.length})
                  {pendingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                  )}
                </button>
              </div>
            </Card>
          </motion.div>

          {/* Friends List */}
          {activeTab === 'friends' && (
            <AnimatePresence mode="wait">
              {friends.length === 0 ? (
                <motion.div key="empty-friends" variants={fadeInUp}>
                  <EmptyState
                    icon={Users}
                    title="No friends yet"
                    description="Search for people and send them friend requests to connect"
                    actionLabel="Find Friends"
                    onAction={() => router.push('/search')}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="friends-list"
                  variants={staggerContainer}
                  className="space-y-3"
                >
                  {friends.map((friend) => (
                    <motion.div key={friend._id} variants={staggerItem}>
                      <Card hover>
                        <div className="flex items-center space-x-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            onClick={() => router.push(`/profile/${friend.username}`)}
                            className="cursor-pointer"
                          >
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              {friend.profileImage ? (
                                <img
                                  src={friend.profileImage}
                                  alt={friend.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                friend.name.charAt(0)
                              )}
                            </div>
                          </motion.div>

                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => router.push(`/profile/${friend.username}`)}
                          >
                            <h3 className="font-semibold text-gray-800 text-lg">
                              {friend.name}
                            </h3>
                            <p className="text-gray-600 text-sm">@{friend.username}</p>
                            {friend.bio && (
                              <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                                {friend.bio}
                              </p>
                            )}
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/profile/${friend.username}`)}
                            >
                              View Profile
                            </Button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveFriend(friend._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Remove friend"
                            >
                              <UserMinus className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Friend Requests */}
          {activeTab === 'requests' && (
            <AnimatePresence mode="wait">
              {pendingRequests.length === 0 ? (
                <motion.div key="empty-requests" variants={fadeInUp}>
                  <EmptyState
                    icon={UserPlus}
                    title="No pending requests"
                    description="You don't have any pending friend requests"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="requests-list"
                  variants={staggerContainer}
                  className="space-y-3"
                >
                  {pendingRequests.map((request) => (
                    <motion.div key={request._id} variants={staggerItem}>
                      <Card hover>
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl cursor-pointer"
                            onClick={() => router.push(`/profile/${request.fromUserId.username}`)}
                          >
                            {request.fromUserId.profileImage ? (
                              <img
                                src={request.fromUserId.profileImage}
                                alt={request.fromUserId.name}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              request.fromUserId.name.charAt(0)
                            )}
                          </div>

                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => router.push(`/profile/${request.fromUserId.username}`)}
                          >
                            <h3 className="font-semibold text-gray-800 text-lg">
                              {request.fromUserId.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              @{request.fromUserId.username}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAcceptRequest(request._id)}
                              className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-md"
                              title="Accept"
                            >
                              <Check className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRejectRequest(request._id)}
                              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                              title="Reject"
                            >
                              <X className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}
