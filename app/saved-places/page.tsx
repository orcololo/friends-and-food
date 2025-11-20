'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Star, MapPin, Utensils } from 'lucide-react';
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

export default function SavedPlacesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadSavedPlaces();
  }, [isAuthenticated, authLoading, router]);

  const loadSavedPlaces = async () => {
    try {
      setIsLoading(true);
      const response = await api.getSavedPlaces(1, 100);
      setPlaces(response.data.places || []);
    } catch (error: any) {
      showToast(error.message || 'Failed to load saved places', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsavePlace = async (placeId: string) => {
    try {
      await api.unsavePlace(placeId);
      setPlaces((prev) => prev.filter((p) => p._id !== placeId));
      showToast('Place removed from saved', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to unsave place', 'error');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Loader size="lg" text="Loading saved places..." fullScreen={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
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
                <Bookmark className="w-10 h-10 mr-3 text-orange-500 fill-orange-500" />
                Saved Places
              </h1>
              <p className="text-gray-600">
                {places.length} {places.length === 1 ? 'place' : 'places'} saved for later
              </p>
            </div>
            <Button onClick={() => router.push('/places')}>
              Discover Places
            </Button>
          </motion.div>

          {/* Places Grid */}
          {places.length === 0 ? (
            <motion.div variants={fadeInUp}>
              <EmptyState
                icon={Bookmark}
                title="No saved places yet"
                description="Start exploring and save your favorite places to visit later"
                actionLabel="Discover Places"
                onAction={() => router.push('/places')}
              />
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {places.map((place) => (
                  <motion.div
                    key={place._id}
                    variants={staggerItem}
                    layout
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card hover className="h-full overflow-hidden">
                      {/* Place Image */}
                      <div
                        className="aspect-video bg-gradient-to-br from-orange-500 to-red-500 relative overflow-hidden cursor-pointer"
                        onClick={() => router.push(`/places/${place._id}`)}
                      >
                        {place.images && place.images.length > 0 ? (
                          <img
                            src={place.images[0]}
                            alt={place.name}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Utensils className="w-20 h-20 text-white/50" />
                          </div>
                        )}

                        {/* Unsave Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnsavePlace(place._id);
                          }}
                          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                        >
                          <Bookmark className="w-5 h-5 text-orange-500 fill-orange-500" />
                        </motion.button>
                      </div>

                      {/* Place Info */}
                      <div className="p-4 space-y-3">
                        <div
                          className="cursor-pointer"
                          onClick={() => router.push(`/places/${place._id}`)}
                        >
                          <h3 className="text-xl font-semibold text-gray-800 line-clamp-1 hover:text-orange-500 transition-colors">
                            {place.name}
                          </h3>

                          <div className="flex items-center space-x-2 mt-2">
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              {place.cuisine}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                              {place.priceRange}
                            </span>
                          </div>

                          {place.averageRating > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                              <span className="text-sm font-medium">
                                {place.averageRating.toFixed(1)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-start space-x-2 mt-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p className="line-clamp-2">{place.address}</p>
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={() => router.push(`/places/${place._id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
