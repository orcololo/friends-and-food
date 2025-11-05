'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, User, Clock } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/utils/api';
import {
  fadeInUp,
  slideInLeft,
  staggerContainer,
  staggerItem,
  pageTransition,
  skeletonPulse,
} from '@/lib/utils/animations';

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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Upcoming Events</h1>
            <p className="text-gray-600">Join dining events with friends</p>
          </div>
          <Button onClick={() => router.push('/events/new')}>Create Event</Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Loading State with Skeleton */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[...Array(5)].map((_, index) => (
                <motion.div
                  key={index}
                  variants={skeletonPulse}
                  initial="initial"
                  animate="animate"
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="flex gap-4">
                        <div className="h-4 bg-gray-200 rounded w-24" />
                        <div className="h-4 bg-gray-200 rounded w-24" />
                        <div className="h-4 bg-gray-200 rounded w-24" />
                      </div>
                    </div>
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
          {!isLoading && !error && events.length === 0 && (
            <motion.div key="empty" variants={fadeInUp} initial="initial" animate="animate" exit="exit">
              <Card shadow="lg" padding="lg" background="gradient">
                <div className="text-center py-12">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Calendar className="w-24 h-24 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No events yet</h3>
                  <p className="text-gray-600 mb-6">Create your first dining event!</p>
                  <Button onClick={() => router.push('/events/new')}>Create First Event</Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Events List */}
          {!isLoading && !error && events.length > 0 && (
            <motion.div key="events" initial="initial" animate="animate" exit="exit">
              <motion.div variants={staggerContainer} className="space-y-4 mb-8">
                {events.map((event) => (
                  <motion.div key={event._id} variants={staggerItem}>
                    <Card
                      hover
                      shadow="lg"
                      padding="lg"
                      className="backdrop-blur-sm transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <motion.div
                          className="flex-1 cursor-pointer"
                          onClick={() => router.push(`/events/${event._id}`)}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <motion.div
                              whileHover={{ rotate: 5, scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Calendar className="w-10 h-10 text-orange-500" strokeWidth={1.5} />
                            </motion.div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
                              <p className="text-gray-600 font-medium">{event.placeId?.name}</p>
                            </div>
                          </div>

                          {event.description && (
                            <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1.5">
                              <Clock className="w-4 h-4 text-orange-500" />
                              <span className="font-medium">{new Date(event.date).toLocaleDateString()}</span>
                              <span>at</span>
                              <span className="font-medium">{event.time}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <Users className="w-4 h-4 text-orange-500" />
                              <span className="font-medium">{event.attendees?.length || 0}</span>
                              <span>attending</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <User className="w-4 h-4 text-orange-500" />
                              <span>by</span>
                              <span className="font-medium">{event.organizer?.name}</span>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          className="flex-shrink-0"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Button
                            onClick={() => handleAttend(event._id)}
                            isLoading={loadingEventId === event._id}
                            disabled={loadingEventId === event._id}
                            className="w-full md:w-auto"
                          >
                            {loadingEventId === event._id ? 'RSVPing...' : 'RSVP'}
                          </Button>
                        </motion.div>
                      </div>
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
