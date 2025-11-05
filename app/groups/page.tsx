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

  // Skeleton loader component
  const GroupSkeleton = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
        </div>
        <div className="h-10 bg-gray-200 rounded animate-pulse w-full" />
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Your Groups
            </h1>
            <p className="text-gray-600">Food communities and dining circles</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => router.push('/groups/new')}>Create Group</Button>
          </motion.div>
        </motion.div>

        {/* Loading State with Skeletons */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <GroupSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card>
              <div className="text-center py-12">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="text-6xl mb-4 inline-block"
                >
                  ⚠️
                </motion.span>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={handleRetry}>Try Again</Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && groups.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card>
              <div className="text-center py-16">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <Users className="w-24 h-24 mx-auto mb-6 text-orange-300" strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">No groups yet</h3>
                <p className="text-gray-600 mb-8">Create a group to start planning together!</p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => router.push('/groups/new')}>Create First Group</Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Groups Grid */}
        {!isLoading && !error && groups.length > 0 && (
          <>
            <motion.div
              initial="initial"
              animate="animate"
              variants={{
                initial: {},
                animate: { transition: { staggerChildren: 0.08 } }
              }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            >
              {groups.map((group, index) => (
                <motion.div
                  key={group._id}
                  variants={{
                    initial: { opacity: 0, y: 30, scale: 0.95 },
                    animate: { opacity: 1, y: 0, scale: 1 }
                  }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  onClick={() => router.push(`/groups/${group._id}`)}
                  className="cursor-pointer group"
                >
                  <div className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden h-full border border-gray-100">
                    <div className="aspect-video bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 relative overflow-hidden">
                      {group.coverImage ? (
                        <img
                          src={group.coverImage}
                          alt={group.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="w-20 h-20 text-purple-300 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                          {group.name}
                        </h3>
                        {group.isPrivate && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-xs bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 px-2.5 py-1 rounded-full font-medium"
                          >
                            Private
                          </motion.span>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span className="font-medium">{group.members?.length || 0} members</span>
                        <span className="text-xs">by {group.createdBy?.name}</span>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button variant="outline" className="w-full group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:border-orange-200 transition-colors">
                          View Group
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

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
