'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Users, User, Clock } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/utils/api';

export default function EventsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadEvents(currentPage);
  }, [currentPage]);

  const loadEvents = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getEvents(page, itemsPerPage);
      setEvents(data.data.events);
      setTotalPages(data.data.pagination.totalPages);
      setTotalItems(data.data.pagination.total);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load events';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttend = async (eventId: string) => {
    try {
      setLoadingEventId(eventId);
      await api.attendEvent(eventId);
      showToast('Successfully RSVP\'d to event!', 'success');
      loadEvents(currentPage); // Reload events
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to RSVP to event';
      showToast(errorMessage, 'error');
      console.error('Failed to attend event:', error);
    } finally {
      setLoadingEventId(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    loadEvents(currentPage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Upcoming Events</h1>
            <p className="text-gray-600">Join dining events with friends</p>
          </div>
          <Button onClick={() => router.push('/events/new')}>Create Event</Button>
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
        {!isLoading && !error && events.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Calendar className="w-24 h-24 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No events yet</h3>
              <p className="text-gray-600 mb-6">Create your first dining event!</p>
              <Button onClick={() => router.push('/events/new')}>Create First Event</Button>
            </div>
          </Card>
        )}

        {/* Events List */}
        {!isLoading && !error && events.length > 0 && (
          <>
            <div className="space-y-4 mb-8">
              {events.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card hover>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => router.push(`/events/${event._id}`)}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <Calendar className="w-10 h-10 text-orange-500" strokeWidth={1.5} />
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
                            <p className="text-gray-600">{event.placeId?.name}</p>
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                            <span>at {event.time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{event.attendees?.length || 0} attending</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>by {event.organizer?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 md:mt-0 md:ml-6">
                        <Button
                          onClick={() => handleAttend(event._id)}
                          isLoading={loadingEventId === event._id}
                          disabled={loadingEventId === event._id}
                        >
                          {loadingEventId === event._id ? 'RSVPing...' : 'RSVP'}
                        </Button>
                      </div>
                    </div>
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
