'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Calendar } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api } from '@/lib/utils/api';

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function MapPage() {
  const router = useRouter();
  const [places, setPlaces] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'places' | 'events'>('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      const [placesData, eventsData] = await Promise.all([
        api.getPlaces(1, 50),
        api.getEvents(1, 50),
      ]);

      setPlaces(placesData.data.places);
      setEvents(eventsData.data.events);
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlaces = selectedFilter === 'events' ? [] : places;
  const filteredEvents = selectedFilter === 'places' ? [] : events;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Interactive Map
          </h1>
          <p className="text-gray-600">Explore restaurants and events near you</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className="lg:col-span-1 space-y-4 overflow-y-auto"
          >
            {/* Filters Card */}
            <Card className="border border-gray-200 shadow-lg">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-gray-800 mb-4"
              >
                Filters
              </motion.h2>
              <div className="flex flex-col space-y-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant={selectedFilter === 'all' ? 'primary' : 'outline'}
                    onClick={() => setSelectedFilter('all')}
                    className="w-full transition-all"
                  >
                    All
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant={selectedFilter === 'places' ? 'primary' : 'outline'}
                    onClick={() => setSelectedFilter('places')}
                    className="w-full transition-all"
                  >
                    Places Only
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant={selectedFilter === 'events' ? 'primary' : 'outline'}
                    onClick={() => setSelectedFilter('events')}
                    className="w-full transition-all"
                  >
                    Events Only
                  </Button>
                </motion.div>
              </div>
            </Card>

            {/* Legend Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border border-gray-200 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4">Legend</h3>
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ x: 4, backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                    className="flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                      <UtensilsCrossed className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">Restaurant/Place</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 4, backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                    className="flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">Event</span>
                  </motion.div>
                </div>
              </Card>
            </motion.div>

            {/* Quick Actions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border border-gray-200 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="w-full hover:bg-orange-50 hover:border-orange-200 transition-colors">
                      <UtensilsCrossed className="w-4 h-4 mr-2" />
                      Add Place
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="w-full hover:bg-orange-50 hover:border-orange-200 transition-colors">
                      <Calendar className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="h-full p-0 overflow-hidden shadow-2xl border border-gray-200">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <MapView places={filteredPlaces} events={filteredEvents} />
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
