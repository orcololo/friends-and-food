'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Calendar, Users, TrendingUp, Clock } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
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
              <Button size="sm">Create Post</Button>
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
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-800">{post.userId?.name}</h3>
                              <span className="text-gray-400 text-sm">@{post.userId?.username}</span>
                            </div>
                            <p className="text-gray-700 mb-3">{post.content}</p>
                            <div className="flex items-center space-x-4 text-gray-500">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="hover:text-orange-500 transition-colors flex items-center space-x-1"
                              >
                                <Heart className="w-4 h-4" />
                                <span className="font-medium">{post.likes?.length || 0}</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="hover:text-orange-500 transition-colors flex items-center space-x-1"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="font-medium">{post.comments?.length || 0}</span>
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
    </motion.div>
  );
}
