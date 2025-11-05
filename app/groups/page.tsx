'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/utils/api';

export default function GroupsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadGroups(currentPage);
  }, [currentPage]);

  const loadGroups = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getGroups(page, itemsPerPage);
      setGroups(data.data.groups);
      setTotalPages(data.data.pagination.totalPages);
      setTotalItems(data.data.pagination.total);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load groups';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Failed to load groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    loadGroups(currentPage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Groups</h1>
            <p className="text-gray-600">Food communities and dining circles</p>
          </div>
          <Button onClick={() => router.push('/groups/new')}>Create Group</Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card>
            <div className="text-center py-12">
              <span className="text-6xl mb-4 inline-block">⚠️</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={handleRetry}>Try Again</Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && groups.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Users className="w-24 h-24 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No groups yet</h3>
              <p className="text-gray-600 mb-6">Create a group to start planning together!</p>
              <Button onClick={() => router.push('/groups/new')}>Create First Group</Button>
            </div>
          </Card>
        )}

        {/* Groups Grid */}
        {!isLoading && !error && groups.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {groups.map((group, index) => (
                <motion.div
                  key={group._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => router.push(`/groups/${group._id}`)}
                  className="cursor-pointer"
                >
                  <Card hover className="h-full">
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-4 flex items-center justify-center">
                      {group.coverImage ? (
                        <img
                          src={group.coverImage}
                          alt={group.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Users className="w-16 h-16 text-purple-300" strokeWidth={1.5} />
                      )}
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

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
    </div>
  );
}
