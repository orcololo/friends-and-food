'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', bio: '' });
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews' | 'events' | 'friends'>('posts');

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <Card className="mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {profile.user.name?.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-1">
                    {profile.user.name}
                  </h1>
                  <p className="text-lg text-gray-600 mb-3">@{profile.user.username}</p>
                  {profile.user.bio && (
                    <p className="text-gray-700 mb-4 max-w-2xl">{profile.user.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center space-x-6 text-sm">
                    <div>
                      <span className="font-bold text-gray-800">{profile.stats.friendsCount}</span>
                      <span className="text-gray-600 ml-1">Friends</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">{profile.stats.postsCount}</span>
                      <span className="text-gray-600 ml-1">Posts</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">{profile.stats.reviewsCount}</span>
                      <span className="text-gray-600 ml-1">Reviews</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">{profile.stats.eventsCount}</span>
                      <span className="text-gray-600 ml-1">Events</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-x-2">
                {isOwnProfile ? (
                  <Button onClick={() => setShowEditModal(true)}>Edit Profile</Button>
                ) : (
                  <>
                    {isFriend ? (
                      <Button variant="outline">Friends ✓</Button>
                    ) : (
                      <Button onClick={handleAddFriend}>Add Friend</Button>
                    )}
                    <Button variant="outline">Message</Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Card className="mb-6">
            <div className="flex space-x-6 border-b">
              {(['posts', 'reviews', 'events', 'friends'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-2 capitalize ${
                    activeTab === tab
                      ? 'border-b-2 border-orange-500 text-orange-500 font-semibold'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </Card>

          {/* Tab Content */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {profile.posts && profile.posts.length > 0 ? (
                profile.posts.map((post: any) => (
                  <Card key={post._id} hover>
                    <p className="text-gray-700 mb-2">{post.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>❤️ {post.likes?.length || 0}</span>
                      <span>💬 {post.comments?.length || 0}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <div className="text-center py-8">
                    <p className="text-gray-500">No posts yet</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {profile.reviews && profile.reviews.length > 0 ? (
                profile.reviews.map((review: any) => (
                  <Card key={review._id} hover>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{review.placeId?.name}</p>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                            >
                              ⭐
                            </span>
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
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              {profile.events && profile.events.length > 0 ? (
                profile.events.map((event: any) => (
                  <Card key={event._id} hover>
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">📅</div>
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
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            </div>
          )}
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
    </div>
  );
}
