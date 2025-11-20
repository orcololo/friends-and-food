'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, UserPlus, Calendar, MapPin, Users, Heart, MessageCircle } from 'lucide-react';
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

interface Notification {
  _id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  relatedModel?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadNotifications();
  }, [isAuthenticated, authLoading, router]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.getNotifications();
      setNotifications(response.data.notifications || []);
    } catch (error: any) {
      showToast(error.message || 'Failed to load notifications', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error: any) {
      showToast(error.message || 'Failed to mark as read', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All notifications marked as read', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to mark all as read', 'error');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await api.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      showToast('Notification deleted', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete notification', 'error');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Navigate to related content
    if (notification.relatedModel && notification.relatedId) {
      switch (notification.relatedModel) {
        case 'Event':
          router.push(`/events/${notification.relatedId}`);
          break;
        case 'Place':
          router.push(`/places/${notification.relatedId}`);
          break;
        case 'Group':
          router.push(`/groups/${notification.relatedId}`);
          break;
        case 'Post':
          router.push(`/posts/${notification.relatedId}`);
          break;
        case 'User':
          router.push(`/profile/${notification.relatedId}`);
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accept':
        return UserPlus;
      case 'event_invite':
      case 'event_reminder':
        return Calendar;
      case 'group_invite':
        return Users;
      case 'place_recommendation':
        return MapPin;
      case 'post_like':
        return Heart;
      case 'post_comment':
        return MessageCircle;
      default:
        return Bell;
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Loader size="lg" text="Loading notifications..." fullScreen={false} />
        </div>
      </div>
    );
  }

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
                <Bell className="w-10 h-10 mr-3 text-orange-500" />
                Notifications
              </h1>
              <p className="text-gray-600">
                {unreadCount > 0 && `${unreadCount} unread • `}
                {notifications.length} total
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                <Check className="w-4 h-4 mr-2" />
                Mark All as Read
              </Button>
            )}
          </motion.div>

          {/* Filter Tabs */}
          <motion.div variants={staggerItem}>
            <Card>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'all'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'unread'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
            </Card>
          </motion.div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <motion.div variants={fadeInUp}>
              <EmptyState
                icon={Bell}
                title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                description={
                  filter === 'unread'
                    ? 'You\'re all caught up!'
                    : 'When you get notifications, they\'ll appear here'
                }
              />
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} className="space-y-3">
              <AnimatePresence>
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <motion.div
                      key={notification._id}
                      variants={staggerItem}
                      layout
                      exit={{ opacity: 0, x: -100 }}
                    >
                      <div
                        className="cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <Card
                          hover
                          className={`transition-all ${
                            !notification.isRead
                              ? 'bg-orange-50 border-l-4 border-l-orange-500'
                              : 'bg-white'
                          }`}
                        >
                        <div className="flex items-start space-x-4">
                          <motion.div
                            className={`p-3 rounded-full ${
                              !notification.isRead
                                ? 'bg-orange-100'
                                : 'bg-gray-100'
                            }`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <Icon
                              className={`w-5 h-5 ${
                                !notification.isRead
                                  ? 'text-orange-600'
                                  : 'text-gray-600'
                              }`}
                            />
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`${
                                !notification.isRead
                                  ? 'font-semibold text-gray-900'
                                  : 'text-gray-700'
                              }`}
                            >
                              {notification.message}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {!notification.isRead && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification._id);
                                }}
                                className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50 transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification._id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                        </Card>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
