'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api } from '@/lib/utils/api';

export default function PlacesPage() {
  const router = useRouter();
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      const data = await api.getPlaces();
      setPlaces(data.data.places);
    } catch (error) {
      console.error('Failed to load places:', error);
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Discover Places</h1>
            <p className="text-gray-600">Find amazing restaurants and dining spots</p>
          </div>
          <Button>Add New Place</Button>
        </div>

        {places.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <span className="text-6xl mb-4 inline-block">🍽️</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No places yet</h3>
              <p className="text-gray-600 mb-6">Be the first to add a restaurant!</p>
              <Button>Add First Place</Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place, index) => (
              <motion.div
                key={place._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="h-full">
                  <div className="aspect-video bg-gradient-to-br from-orange-100 to-red-100 rounded-lg mb-4 flex items-center justify-center text-6xl">
                    🍽️
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
        )}
      </div>
    </div>
  );
}
