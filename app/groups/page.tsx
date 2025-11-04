'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api } from '@/lib/utils/api';

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data.data.groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Groups</h1>
            <p className="text-gray-600">Food communities and dining circles</p>
          </div>
          <Button>Create Group</Button>
        </div>

        {groups.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <span className="text-6xl mb-4 inline-block">👥</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No groups yet</h3>
              <p className="text-gray-600 mb-6">Create a group to start planning together!</p>
              <Button>Create First Group</Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, index) => (
              <motion.div
                key={group._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="h-full">
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-4 flex items-center justify-center text-6xl">
                    👥
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{group.name}</h3>
                    {group.isPrivate && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        Private
                      </span>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{group.members?.length || 0} members</span>
                    <span>by {group.createdBy?.name}</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    View Group
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
