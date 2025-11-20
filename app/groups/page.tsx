'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Globe, Lock, UserPlus, Compass } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/utils/api';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  skeletonPulse,
} from '@/lib/utils/animations';

type TabType = 'my-groups' | 'discover';

export default function GroupsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('my-groups');
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadCurrentUser();
    loadMyGroups();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await api.getMe();
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadMyGroups = async () => {
    try {
      setIsLoading(true);
      const data = await api.getGroups(1, 50);
      setMyGroups(data.data.groups);
    } catch (error: any) {
      showToast(error.message || 'Failed to load groups', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDiscoverGroups = async () => {
    try {
      setIsLoading(true);
      const data = await api.discoverGroups(1, 50);
      setDiscoverGroups(data.data.groups);
    } catch (error: any) {
      showToast(error.message || 'Failed to load groups', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'discover' && discoverGroups.length === 0) {
      loadDiscoverGroups();
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!currentUser) return;

    try {
      await api.addGroupMember(groupId, currentUser._id);
      showToast('Successfully joined the group!', 'success');

      // Reload both lists
      loadMyGroups();
      loadDiscoverGroups();
    } catch (error: any) {
      showToast(error.message || 'Failed to join group', 'error');
    }
  };

  const tabs = [
    { id: 'my-groups' as TabType, label: 'My Groups', icon: Users, count: myGroups.length },
    { id: 'discover' as TabType, label: 'Discover', icon: Compass, count: discoverGroups.length },
  ];

  const GroupCard = ({ group, showJoinButton = false }: { group: any; showJoinButton?: boolean }) => {
    const isCreator = currentUser && group.createdBy?._id === currentUser._id;

    return (
      <motion.div
        variants={staggerItem}
        whileHover={{ y: -8, scale: 1.02 }}
        onClick={() => !showJoinButton && router.push(`/groups/${group._id}`)}
        className={`${!showJoinButton ? 'cursor-pointer' : ''}`}
      >
        <Card hover className="h-full overflow-hidden">
          {/* Cover Image */}
          <div className="aspect-video bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 relative overflow-hidden">
            {group.coverImage ? (
              <img
                src={group.coverImage}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="w-20 h-20 text-white/50" strokeWidth={1.5} />
              </div>
            )}
            <div className="absolute top-2 right-2">
              {group.isPrivate ? (
                <span className="px-2 py-1 bg-gray-900/70 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center">
                  <Lock className="w-3 h-3 mr-1" />
                  Private
                </span>
              ) : (
                <span className="px-2 py-1 bg-green-500/70 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center">
                  <Globe className="w-3 h-3 mr-1" />
                  Public
                </span>
              )}
            </div>
          </div>

          {/* Group Info */}
          <div className="p-4 space-y-3">
            <h3 className="text-xl font-semibold text-gray-800 line-clamp-1 flex items-center">
              {group.name}
              {isCreator && (
                <Crown className="w-4 h-4 ml-2 text-yellow-500 fill-yellow-500" />
              )}
            </h3>

            {group.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>
            )}

            {/* Group Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{group.members?.length || 0} members</span>
              </div>
              <span className="text-xs">
                by {group.createdBy?.name || 'Unknown'}
              </span>
            </div>

            {/* Join Button for Discover Tab */}
            {showJoinButton && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinGroup(group._id);
                }}
                className="w-full"
                size="sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Join Group
              </Button>
            )}

            {/* View Button for My Groups */}
            {!showJoinButton && (
              <Button variant="outline" size="sm" className="w-full">
                View Group
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Food Groups
            </h1>
            <p className="text-gray-600">Join communities and discover dining circles</p>
          </div>
          <Button onClick={() => router.push('/groups/new')}>
            <Users className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex space-x-2 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative px-6 py-3 font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-purple-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        activeTab === tab.id
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Loading State */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[...Array(6)].map((_, index) => (
                <motion.div
                  key={index}
                  variants={skeletonPulse}
                  initial="initial"
                  animate="animate"
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-10 bg-gray-200 rounded" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* My Groups Tab */}
          {!isLoading && activeTab === 'my-groups' && (
            <motion.div
              key="my-groups"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {myGroups.length === 0 ? (
                <motion.div variants={fadeInUp}>
                  <Card>
                    <div className="text-center py-16">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Users className="w-24 h-24 mx-auto mb-4 text-gray-300" />
                      </motion.div>
                      <h3 className="text-2xl font-semibold text-gray-800 mb-2">No groups yet</h3>
                      <p className="text-gray-600 mb-6">
                        Create your first food community or discover existing ones!
                      </p>
                      <div className="flex justify-center space-x-3">
                        <Button onClick={() => router.push('/groups/new')}>
                          Create Group
                        </Button>
                        <Button variant="outline" onClick={() => handleTabChange('discover')}>
                          <Compass className="w-4 h-4 mr-2" />
                          Discover Groups
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myGroups.map((group) => (
                    <GroupCard key={group._id} group={group} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Discover Tab */}
          {!isLoading && activeTab === 'discover' && (
            <motion.div
              key="discover"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {discoverGroups.length === 0 ? (
                <motion.div variants={fadeInUp}>
                  <Card>
                    <div className="text-center py-16">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      >
                        <Compass className="w-24 h-24 mx-auto mb-4 text-gray-300" />
                      </motion.div>
                      <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                        No public groups to discover
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Be the first to create a public group for others to join!
                      </p>
                      <Button onClick={() => router.push('/groups/new')}>
                        Create Public Group
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {discoverGroups.map((group) => (
                    <GroupCard key={group._id} group={group} showJoinButton />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
