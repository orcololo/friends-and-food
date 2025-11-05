'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, Star, Bookmark, Search, SlidersHorizontal } from 'lucide-react';
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
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({
    cuisine: 'all',
    priceRange: 'all',
    minRating: 0,
  });
  const [sortBy, setSortBy] = useState('rating-desc');
  const [showFilters, setShowFilters] = useState(false);

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

  // Load saved places
  const loadSavedPlaces = useCallback(async () => {
    try {
      const response = await api.getSavedPlaces();
      const savedIds = new Set<string>(response.data.places.map((p: any) => p._id as string));
      setSavedPlaceIds(savedIds);
    } catch (error) {
      console.error('Failed to load saved places:', error);
    }
  }, []);

  // Load saved places on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedPlaces();
    }
  }, [isAuthenticated, loadSavedPlaces]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle bookmark toggle
  const handleBookmark = async (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const isSaved = savedPlaceIds.has(placeId);

    // Optimistic update
    setSavedPlaceIds(prev => {
      const newSet = new Set(prev);
      if (isSaved) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });

    try {
      if (isSaved) {
        await api.unsavePlace(placeId);
        showToast('Removed from saved places', 'success');
      } else {
        await api.savePlace(placeId);
        showToast('Place saved!', 'success');
      }
    } catch (error: any) {
      // Revert on error
      setSavedPlaceIds(prev => {
        const newSet = new Set(prev);
        if (isSaved) {
          newSet.add(placeId);
        } else {
          newSet.delete(placeId);
        }
        return newSet;
      });
      showToast(error.message || 'Failed to update saved place', 'error');
    }
  };

  // Memoized callback for navigation to place detail
  const handlePlaceClick = useCallback((placeId: string) => {
    router.push(`/places/${placeId}`);
  }, [router]);

  // Filter and sort places
  const filteredAndSortedPlaces = useMemo(() => {
    let filtered = [...places];

    // Search filter
    if (debouncedSearch) {
      filtered = filtered.filter(place =>
        place.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        place.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Cuisine filter
    if (filters.cuisine !== 'all') {
      filtered = filtered.filter(place => place.cuisine === filters.cuisine);
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(place => place.priceRange === parseInt(filters.priceRange));
    }

    // Min rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(place => place.averageRating >= filters.minRating);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating-desc':
          return b.averageRating - a.averageRating;
        case 'rating-asc':
          return a.averageRating - b.averageRating;
        case 'price-asc':
          return a.priceRange - b.priceRange;
        case 'price-desc':
          return b.priceRange - a.priceRange;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [places, debouncedSearch, filters, sortBy]);

  // Get unique cuisines for filter dropdown
  const cuisineOptions = useMemo(() => {
    const cuisines = new Set(places.map(p => p.cuisine));
    return Array.from(cuisines).sort();
  }, [places]);

  // Compute if we have data to show
  const hasPlaces = useMemo(() => !isLoading && !error && filteredAndSortedPlaces.length > 0, [isLoading, error, filteredAndSortedPlaces.length]);
  const showEmptyState = useMemo(() => !isLoading && !error && filteredAndSortedPlaces.length === 0, [isLoading, error, filteredAndSortedPlaces.length]);

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

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          {/* Search and Filter Toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search places by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters {showFilters ? '−' : '+'}
            </Button>
          </div>

          {/* Filter Options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden"
              >
                {/* Cuisine Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
                  <select
                    value={filters.cuisine}
                    onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Cuisines</option>
                    {cuisineOptions.map(cuisine => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Prices</option>
                    <option value="1">$ - Budget</option>
                    <option value="2">$$ - Moderate</option>
                    <option value="3">$$$ - Upscale</option>
                    <option value="4">$$$$ - Fine Dining</option>
                  </select>
                </div>

                {/* Min Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="0">Any Rating</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="rating-desc">Rating (High to Low)</option>
                    <option value="rating-asc">Rating (Low to High)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filters Display */}
          {(searchTerm || filters.cuisine !== 'all' || filters.priceRange !== 'all' || filters.minRating > 0) && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-sm rounded">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-orange-900">✕</button>
                </span>
              )}
              {filters.cuisine !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-sm rounded">
                  {filters.cuisine}
                  <button onClick={() => setFilters({ ...filters, cuisine: 'all' })} className="ml-1 hover:text-orange-900">✕</button>
                </span>
              )}
              {filters.priceRange !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-sm rounded">
                  {'$'.repeat(parseInt(filters.priceRange))}
                  <button onClick={() => setFilters({ ...filters, priceRange: 'all' })} className="ml-1 hover:text-orange-900">✕</button>
                </span>
              )}
              {filters.minRating > 0 && (
                <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-sm rounded">
                  {filters.minRating}+ Stars
                  <button onClick={() => setFilters({ ...filters, minRating: 0 })} className="ml-1 hover:text-orange-900">✕</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ cuisine: 'all', priceRange: 'all', minRating: 0 });
                }}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
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
                {filteredAndSortedPlaces.map((place) => (
                  <motion.div
                    key={place._id}
                    variants={staggerItem}
                    whileHover={{ y: -4 }}
                    onClick={() => handlePlaceClick(place._id)}
                    className="cursor-pointer"
                  >
                    <Card hover shadow="lg" padding="lg" className="h-full backdrop-blur-sm">
                      <motion.div
                        className="aspect-video bg-gradient-to-br from-orange-100 to-red-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden shadow-inner relative"
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
                        {/* Bookmark Button */}
                        <motion.button
                          onClick={(e) => handleBookmark(place._id, e)}
                          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all ${
                            savedPlaceIds.has(place._id)
                              ? 'bg-orange-500 text-white'
                              : 'bg-white/80 text-gray-600 hover:bg-orange-500 hover:text-white'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Bookmark
                            className={`w-5 h-5 ${savedPlaceIds.has(place._id) ? 'fill-white' : ''}`}
                          />
                        </motion.button>
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
