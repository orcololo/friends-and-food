'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api } from '@/lib/utils/api';

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch (error) {
      console.error('Failed to load group:', error);
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

      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <Card className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 flex-1">
                <Users className="w-16 h-16 text-purple-500" strokeWidth={1.5} />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-4xl font-bold text-gray-800">{group.name}</h1>
                    {group.isPrivate && (
                      <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full">
                        Private
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">
                    {group.members?.length || 0} members
                  </p>
                  <p className="text-sm text-gray-500">
                    Created by {group.createdBy?.name}
                  </p>
                </div>
              </div>
              <div className="space-x-2">
                <Button>Join Group</Button>
                <Button variant="outline">Invite Friends</Button>
              </div>
            </div>

            {group.description && (
              <p className="text-gray-700 mt-4">{group.description}</p>
            )}
          </Card>

          {/* Cover Image */}
          {group.coverImage && (
            <Card className="mb-6 p-0 overflow-hidden">
              <img
                src={group.coverImage}
                alt={group.name}
                className="w-full h-64 object-cover"
              />
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Members */}
            <div className="lg:col-span-2">
              <Card>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Members ({group.members?.length || 0})
                </h2>

                {group.members && group.members.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.members.map((member: any) => (
                      <div
                        key={member._id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => router.push(`/profile/${member.username}`)}
                      >
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                          {member.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{member.name}</p>
                          <p className="text-sm text-gray-500">@{member.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No members yet</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar - Group Info */}
            <div className="space-y-6">
              <Card>
                <h3 className="font-semibold text-gray-800 mb-3">Group Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="text-gray-800 font-medium">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type</span>
                    <span className="text-gray-800 font-medium">
                      {group.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Members</span>
                    <span className="text-gray-800 font-medium">
                      {group.members?.length || 0}
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    Create Event
                  </Button>
                  <Button variant="outline" className="w-full">
                    Share Group
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
