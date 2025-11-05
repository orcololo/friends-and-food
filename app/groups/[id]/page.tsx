'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Share2, UserPlus, Lock, Globe } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/utils/api';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  scaleIn,
  popIn,
  skeletonPulse,
} from '@/lib/utils/animations';

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadGroupDetails();
  }, [params.id]);

  const loadGroupDetails = async () => {
    try {
      const data = await api.getGroup(params.id as string);
      setGroup(data.data);
      // Check if current user is a member (simplified logic)
      setIsMember(true); // Would check against actual user data
    } catch (error) {
      console.error('Failed to load group:', error);
      showToast('Failed to load group', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: group?.name,
        text: `Join ${group?.name} on Friends & Food!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    }
  }, [group, showToast]);

  const handleJoinGroup = useCallback(() => {
    setIsMember(!isMember);
    showToast(isMember ? 'Left the group' : 'Joined the group!', isMember ? 'info' : 'success');
  }, [isMember, showToast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <motion.div
          variants={skeletonPulse}
          initial="initial"
          animate="animate"
          className="h-64 bg-gray-200"
        />
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                variants={skeletonPulse}
                initial="initial"
                animate="animate"
                className="h-48 bg-gray-200 rounded-xl"
              />
              <motion.div
                variants={skeletonPulse}
                initial="initial"
                animate="animate"
                className="h-96 bg-gray-200 rounded-xl"
              />
            </div>
            <motion.div
              variants={skeletonPulse}
              initial="initial"
              animate="animate"
              className="h-64 bg-gray-200 rounded-xl"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Group not found</h2>
              <Button onClick={() => router.push('/groups')}>Back to Groups</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Cover Image with Gradient Overlay */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="relative h-72 overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-red-500"
      >
        {group.coverImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${group.coverImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          </>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="container mx-auto">
            <div className="flex items-end justify-between">
              <div className="flex items-end space-x-4 flex-1">
                <motion.div
                  variants={scaleIn}
                  className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-2xl"
                >
                  <Users className="w-12 h-12 text-purple-500" strokeWidth={2} />
                </motion.div>
                <div className="flex-1 pb-2">
                  <motion.div variants={fadeInUp} className="flex items-center space-x-3 mb-2">
                    <h1 className="text-5xl font-bold drop-shadow-lg">{group.name}</h1>
                    {group.isPrivate ? (
                      <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center">
                        <Lock className="w-4 h-4 mr-1" />
                        Private
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center">
                        <Globe className="w-4 h-4 mr-1" />
                        Public
                      </span>
                    )}
                  </motion.div>
                  <motion.p variants={fadeInUp} className="text-lg text-white/90">
                    {group.members?.length || 0} members • Created by{' '}
                    <span className="font-semibold">{group.createdBy?.name}</span>
                  </motion.p>
                </div>
              </div>
              <motion.div variants={scaleIn} className="flex items-center space-x-3 pb-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  aria-label="Share group"
                >
                  <Share2 className="w-6 h-6" />
                </motion.button>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isMember ? 'member' : 'not-member'}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <Button
                      onClick={handleJoinGroup}
                      className="bg-white text-purple-500 hover:bg-gray-100"
                    >
                      {isMember ? (
                        <>
                          <Users className="w-4 h-4 mr-2" />
                          Member
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Join Group
                        </>
                      )}
                    </Button>
                  </motion.div>
                </AnimatePresence>
                <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white hover:bg-white/30">
                  Invite
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Description */}
          {group.description && (
            <motion.div variants={staggerItem}>
              <Card>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">About</h2>
                <p className="text-gray-700 leading-relaxed">{group.description}</p>
              </Card>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Members */}
            <motion.div variants={staggerItem} className="lg:col-span-2">
              <Card>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Members ({group.members?.length || 0})
                </h2>

                {group.members && group.members.length > 0 ? (
                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {group.members.map((member: any, index: number) => {
                      const isCreator = member._id === group.createdBy?._id;
                      return (
                        <motion.div
                          key={member._id}
                          variants={staggerItem}
                          custom={index}
                          whileHover={{ scale: 1.03, y: -2 }}
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer relative overflow-hidden"
                          onClick={() => router.push(`/profile/${member.username}`)}
                        >
                          {isCreator && (
                            <div className="absolute top-0 right-0 p-1.5">
                              <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', delay: index * 0.05 }}
                              >
                                <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              </motion.div>
                            </div>
                          )}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.03, type: 'spring' }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md ${
                              isCreator
                                ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500'
                                : 'bg-gradient-to-br from-purple-500 to-pink-500'
                            }`}
                          >
                            {member.name?.charAt(0)}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {member.name}
                              {isCreator && (
                                <span className="ml-2 text-xs text-orange-500 font-semibold">Admin</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 truncate">@{member.username}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    variants={fadeInUp}
                    className="text-center py-12 bg-gray-50 rounded-lg"
                  >
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No members yet</p>
                  </motion.div>
                )}
              </Card>
            </motion.div>

            {/* Sidebar - Group Info */}
            <motion.div variants={staggerItem} className="space-y-6">
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
                <h3 className="font-semibold text-gray-800 mb-4 text-lg">Group Info</h3>
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-between items-center p-3 bg-white rounded-lg"
                  >
                    <span className="text-gray-600 font-medium">Created</span>
                    <span className="text-gray-800 font-bold">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-between items-center p-3 bg-white rounded-lg"
                  >
                    <span className="text-gray-600 font-medium">Type</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      group.isPrivate ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {group.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-between items-center p-3 bg-white rounded-lg"
                  >
                    <span className="text-gray-600 font-medium">Members</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {group.members?.length || 0}
                    </span>
                  </motion.div>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-gray-800 mb-3 text-lg">Quick Actions</h3>
                <div className="space-y-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full border-purple-200 hover:bg-purple-50"
                      onClick={() => router.push('/events/create')}
                    >
                      Create Event
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full border-purple-200 hover:bg-purple-50"
                      onClick={handleShare}
                    >
                      Share Group
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
