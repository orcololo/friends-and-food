'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api } from '@/lib/utils/api';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data.data.events);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttend = async (eventId: string) => {
    try {
      await api.attendEvent(eventId);
      loadEvents(); // Reload events
    } catch (error: any) {
      console.error('Failed to attend event:', error);
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Upcoming Events</h1>
            <p className="text-gray-600">Join dining events with friends</p>
          </div>
          <Button>Create Event</Button>
        </div>

        {events.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <span className="text-6xl mb-4 inline-block">📅</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No events yet</h3>
              <p className="text-gray-600 mb-6">Create your first dining event!</p>
              <Button>Create First Event</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="text-4xl">📅</div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
                          <p className="text-gray-600">{event.placeId?.name}</p>
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-gray-600 mb-3">{event.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span>🕐</span>
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                          <span>at {event.time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>👥</span>
                          <span>{event.attendees?.length || 0} attending</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>👤</span>
                          <span>by {event.organizer?.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 md:ml-6">
                      <Button onClick={() => handleAttend(event._id)}>
                        RSVP
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
