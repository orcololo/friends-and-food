'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, MessageCircle } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api } from '@/lib/utils/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Here's what's happening in your food community</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Activity Feed</h2>
              <Button size="sm">Create Post</Button>
            </div>

            {posts.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-4">No posts yet</p>
                  <p className="text-gray-400">Follow friends or create your first post!</p>
                </div>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post._id} hover>
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {post.userId?.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{post.userId?.name}</h3>
                        <span className="text-gray-400 text-sm">@{post.userId?.username}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{post.content}</p>
                      <div className="flex items-center space-x-4 text-gray-500">
                        <button className="hover:text-orange-500 transition-colors flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.likes?.length || 0}</span>
                        </button>
                        <button className="hover:text-orange-500 transition-colors flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments?.length || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Friends</span>
                  <span className="font-bold text-orange-500">{user?.friends?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Events</span>
                  <span className="font-bold text-orange-500">{events.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Posts</span>
                  <span className="font-bold text-orange-500">{posts.length}</span>
                </div>
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <h3 className="font-semibold text-gray-800 mb-4">Upcoming Events</h3>
              {events.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event._id} className="border-l-4 border-orange-500 pl-3 py-2">
                      <h4 className="font-medium text-gray-800">{event.title}</h4>
                      <p className="text-sm text-gray-500">{event.placeId?.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
