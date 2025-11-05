'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Calendar, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
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
  const [showDebug, setShowDebug] = useState(false);

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

      const places = placesData.data.places || [];
      const events = eventsData.data.events || [];

      console.log('Loaded places:', places.length);
      console.log('Loaded events:', events.length);
      console.log('Places with location:', places.filter((p: any) => p.location?.coordinates).length);
      console.log('Events with location:', events.filter((e: any) => e.location?.coordinates).length);

      // Log first place/event for debugging
      if (places.length > 0) {
        console.log('First place:', { name: places[0].name, location: places[0].location });
      }
      if (events.length > 0) {
        console.log('First event:', { title: events[0].title, location: events[0].location });
      }

      setPlaces(places);
      setEvents(events);
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlaces = selectedFilter === 'events' ? [] : places;
  const filteredEvents = selectedFilter === 'places' ? [] : events;

  // Calculate debug information
  const validPlaces = places.filter(p =>
    p.location?.coordinates &&
    Array.isArray(p.location.coordinates) &&
    p.location.coordinates.length === 2 &&
    typeof p.location.coordinates[0] === 'number' &&
    typeof p.location.coordinates[1] === 'number'
  );

  const validEvents = events.filter(e =>
    e.location?.coordinates &&
    Array.isArray(e.location.coordinates) &&
    e.location.coordinates.length === 2 &&
    typeof e.location.coordinates[0] === 'number' &&
    typeof e.location.coordinates[1] === 'number'
  );

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

        {/* Debug Panel */}
        {(places.length === 0 || validPlaces.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-2 border-yellow-300 bg-yellow-50">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-900 mb-2">No Map Markers Available</h3>
                  {places.length === 0 ? (
                    <div className="space-y-2 text-sm text-yellow-800">
                      <p>No places found in the database.</p>
                      <p className="font-semibold">To fix this, run the seed script:</p>
                      <pre className="bg-yellow-100 p-3 rounded mt-2 overflow-x-auto text-xs">
                        npm install -g ts-node{'\n'}
                        ts-node scripts/seed-sample-data.ts
                      </pre>
                      <p className="mt-2">Or create a place manually using the "Add Place" button in the sidebar.</p>
                    </div>
                  ) : validPlaces.length === 0 ? (
                    <div className="space-y-2 text-sm text-yellow-800">
                      <p>Found {places.length} place(s) but none have valid location coordinates.</p>
                      <p>Places need a location object with coordinates: <code className="bg-yellow-100 px-1 rounded">[longitude, latitude]</code></p>
                      <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="mt-2 text-yellow-900 font-medium underline hover:no-underline flex items-center space-x-1"
                      >
                        <span>{showDebug ? 'Hide' : 'Show'} Debug Info</span>
                        {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Detailed Debug Panel */}
        {showDebug && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="border border-gray-300 bg-gray-50">
              <h3 className="font-bold text-gray-900 mb-4">Debug Information</h3>
              <div className="space-y-4 text-sm">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded border border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-700">Places Loaded:</p>
                    <p className="text-2xl font-bold text-orange-600">{places.length}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Valid Coordinates:</p>
                    <p className="text-2xl font-bold text-green-600">{validPlaces.length}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Events Loaded:</p>
                    <p className="text-2xl font-bold text-purple-600">{events.length}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Valid Coordinates:</p>
                    <p className="text-2xl font-bold text-green-600">{validEvents.length}</p>
                  </div>
                </div>

                {/* First Place Details */}
                {places.length > 0 && (
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <p className="font-semibold text-gray-700 mb-2">First Place Data:</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify({
                        name: places[0].name,
                        _id: places[0]._id,
                        location: places[0].location,
                        hasLocation: !!places[0].location,
                        hasCoordinates: !!places[0].location?.coordinates,
                        isArray: Array.isArray(places[0].location?.coordinates),
                        length: places[0].location?.coordinates?.length,
                        coordinates: places[0].location?.coordinates,
                      }, null, 2)}
                    </pre>
                  </div>
                )}

                {/* All Places Summary */}
                {places.length > 0 && (
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <p className="font-semibold text-gray-700 mb-2">All Places ({places.length}):</p>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {places.map((place, idx) => {
                        const hasValidCoords = place.location?.coordinates &&
                          Array.isArray(place.location.coordinates) &&
                          place.location.coordinates.length === 2 &&
                          typeof place.location.coordinates[0] === 'number' &&
                          typeof place.location.coordinates[1] === 'number';

                        return (
                          <div
                            key={place._id || idx}
                            className={`flex items-center justify-between p-2 rounded text-xs ${
                              hasValidCoords ? 'bg-green-50' : 'bg-red-50'
                            }`}
                          >
                            <span className="font-medium truncate flex-1">{place.name}</span>
                            <span className={`ml-2 px-2 py-1 rounded ${
                              hasValidCoords ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                            }`}>
                              {hasValidCoords ? '✓ Valid' : '✗ Invalid'}
                            </span>
                            {hasValidCoords && (
                              <span className="ml-2 text-gray-600 text-xs">
                                [{place.location.coordinates[0].toFixed(4)}, {place.location.coordinates[1].toFixed(4)}]
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-2">Troubleshooting Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Check if places have <code className="bg-blue-100 px-1 rounded">location.coordinates</code></li>
                    <li>Coordinates must be <code className="bg-blue-100 px-1 rounded">[longitude, latitude]</code> format</li>
                    <li>Both values must be numbers (not strings)</li>
                    <li>Run seed script to populate sample data with valid coordinates</li>
                    <li>Check browser console for MapView debugging logs</li>
                  </ol>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

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

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border border-gray-200 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4">Map Data</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Places:</span>
                    <span className="font-semibold text-orange-600">{places.length}</span>
                  </div>
                  <div className="flex items-center justify-between pl-4">
                    <span className="text-gray-500 text-xs">With valid coords:</span>
                    <span className={`font-semibold text-xs ${validPlaces.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {validPlaces.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Events:</span>
                    <span className="font-semibold text-purple-600">{events.length}</span>
                  </div>
                  <div className="flex items-center justify-between pl-4">
                    <span className="text-gray-500 text-xs">With valid coords:</span>
                    <span className={`font-semibold text-xs ${validEvents.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {validEvents.length}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Visible Places:</span>
                    <span className="font-semibold text-orange-600">{filteredPlaces.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Visible Events:</span>
                    <span className="font-semibold text-purple-600">{filteredEvents.length}</span>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Total Markers:</span>
                    <span className={`font-bold text-lg ${(validPlaces.length + validEvents.length) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {validPlaces.length + validEvents.length}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Legend Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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
              transition={{ delay: 0.5 }}
            >
              <Card className="border border-gray-200 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full hover:bg-orange-50 hover:border-orange-200 transition-colors"
                      onClick={() => router.push('/places/new')}
                    >
                      <UtensilsCrossed className="w-4 h-4 mr-2" />
                      Add Place
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full hover:bg-orange-50 hover:border-orange-200 transition-colors"
                      onClick={() => router.push('/events/new')}
                    >
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
