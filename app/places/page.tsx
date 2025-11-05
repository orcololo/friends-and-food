'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/utils/api';

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Discover Places</h1>
            <p className="text-gray-600">Find amazing restaurants and dining spots</p>
          </div>
          <Button onClick={() => router.push('/places/new')}>Add New Place</Button>
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
        {showEmptyState && (
          <Card>
            <div className="text-center py-12">
              <span className="text-6xl mb-4 inline-block">🍽️</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No places yet</h3>
              <p className="text-gray-600 mb-6">Be the first to add a restaurant!</p>
              <Button onClick={() => router.push('/places/new')}>Add First Place</Button>
            </div>
          </Card>
        )}

        {/* Places Grid */}
        {hasPlaces && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {places.map((place, index) => (
                <motion.div
                  key={place._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handlePlaceClick(place._id)}
                  className="cursor-pointer"
                >
                  <Card hover className="h-full">
                    <div className="aspect-video bg-gradient-to-br from-orange-100 to-red-100 rounded-lg mb-4 flex items-center justify-center text-6xl">
                      {place.images && place.images.length > 0 ? (
                        <img
                          src={place.images[0]}
                          alt={place.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        '🍽️'
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{place.name}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-600">{place.cuisine}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{'$'.repeat(place.priceRange)}</span>
                    </div>
                    <div className="flex items-center space-x-1 mb-3">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-medium">{place.averageRating.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{place.address}</p>
                    <Button variant="outline" className="w-full">
                      View Details
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
