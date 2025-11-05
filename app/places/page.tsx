'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, Star } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/utils/api';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  pageTransition,
  skeletonPulse,
} from '@/lib/utils/animations';

export default function PlacesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Memoized loading function to prevent recreation on every render
  const loadPlaces = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getPlaces(page, itemsPerPage);
      setPlaces(data.data.places);
      setTotalPages(data.data.pagination.totalPages);
      setTotalItems(data.data.pagination.total);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load places';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Failed to load places:', error);
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, showToast]);

  // Auth check and load places
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadPlaces(currentPage);
  }, [currentPage, isAuthenticated, authLoading, router, loadPlaces]);

  // Memoized callback for page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Memoized callback for retry
  const handleRetry = useCallback(() => {
    loadPlaces(currentPage);
  }, [loadPlaces, currentPage]);

  // Memoized callback for navigation to place detail
  const handlePlaceClick = useCallback((placeId: string) => {
    router.push(`/places/${placeId}`);
  }, [router]);

  // Compute if we have data to show
  const hasPlaces = useMemo(() => !isLoading && !error && places.length > 0, [isLoading, error, places.length]);
  const showEmptyState = useMemo(() => !isLoading && !error && places.length === 0, [isLoading, error, places.length]);

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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Discover Places</h1>
            <p className="text-gray-600">Find amazing restaurants and dining spots</p>
          </div>
          <Button onClick={() => router.push('/places/new')}>Add New Place</Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Loading State with Skeleton */}
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
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-10 bg-gray-200 rounded" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <motion.div key="error" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
              <Card shadow="lg" padding="lg">
                <div className="text-center py-12">
                  <motion.span
                    className="text-6xl mb-4 inline-block"
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    ⚠️
                  </motion.span>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <Button onClick={handleRetry}>Try Again</Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Empty State */}
          {showEmptyState && (
            <motion.div key="empty" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
              <Card shadow="lg" padding="lg" background="gradient">
                <div className="text-center py-12">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <UtensilsCrossed className="w-24 h-24 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No places yet</h3>
                  <p className="text-gray-600 mb-6">Be the first to add a restaurant!</p>
                  <Button onClick={() => router.push('/places/new')}>Add First Place</Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Places Grid */}
          {hasPlaces && (
            <motion.div key="places" initial="initial" animate="animate" exit="exit">
              <motion.div
                variants={staggerContainer}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              >
                {places.map((place) => (
                  <motion.div
                    key={place._id}
                    variants={staggerItem}
                    whileHover={{ y: -4 }}
                    onClick={() => handlePlaceClick(place._id)}
                    className="cursor-pointer"
                  >
                    <Card hover shadow="lg" padding="lg" className="h-full backdrop-blur-sm">
                      <motion.div
                        className="aspect-video bg-gradient-to-br from-orange-100 to-red-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden shadow-inner"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        {place.images && place.images.length > 0 ? (
                          <img
                            src={place.images[0]}
                            alt={place.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UtensilsCrossed className="w-16 h-16 text-orange-300" strokeWidth={1.5} />
                        )}
                      </motion.div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">
                        {place.name}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-600 font-medium">{place.cuisine}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-orange-600 font-semibold">
                          {'$'.repeat(place.priceRange)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 mb-3">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {place.averageRating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{place.address}</p>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              <motion.div variants={fadeInUp}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
