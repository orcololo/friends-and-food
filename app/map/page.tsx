'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            <Card>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
              <div className="flex flex-col space-y-2">
                <Button
                  variant={selectedFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setSelectedFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedFilter === 'places' ? 'primary' : 'outline'}
                  onClick={() => setSelectedFilter('places')}
                >
                  Places Only
                </Button>
                <Button
                  variant={selectedFilter === 'events' ? 'primary' : 'outline'}
                  onClick={() => setSelectedFilter('events')}
                >
                  Events Only
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-800 mb-3">Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🍽️</span>
                  <span className="text-gray-700">Restaurant/Place</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📅</span>
                  <span className="text-gray-700">Event</span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  Add Place
                </Button>
                <Button variant="outline" className="w-full">
                  Create Event
                </Button>
              </div>
            </Card>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="h-full p-0 overflow-hidden">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <MapView places={filteredPlaces} events={filteredEvents} />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
