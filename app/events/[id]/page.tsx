'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, MapPin, Clock, Share2, CheckCircle2, XCircle } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/utils/api';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  scaleIn,
  popIn,
  skeletonPulse,
} from '@/lib/utils/animations';

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Calculate countdown for upcoming events
  useEffect(() => {
    if (!event || event.status !== 'upcoming') return;

    const calculateCountdown = () => {
      const eventDate = new Date(event.date);
      const now = new Date();
      const difference = eventDate.getTime() - now.getTime();

      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);

    return () => clearInterval(timer);
  }, [event]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadEventDetails();
  }, [params.id]);

  const loadEventDetails = async () => {
    try {
      const data = await api.getEvent(params.id as string);
      setEvent(data.data);
      // Check if current user is attending
      const token = localStorage.getItem('token');
      if (token) {
        const userResponse = await api.getMe();
        const userId = userResponse.data.id;
        setIsAttending(data.data.attendees.some((a: any) => a._id === userId));
      }
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRSVP = async () => {
    try {
      if (isAttending) {
        await api.unattendEvent(params.id as string);
        showToast('You left the event', 'info');
      } else {
        await api.attendEvent(params.id as string);
        showToast('Successfully joined the event!', 'success');
      }
      loadEventDetails();
    } catch (error: any) {
      showToast(error.message || 'Failed to update RSVP', 'error');
    }
  };

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: `Join me at ${event?.title}!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    }
  }, [event, showToast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={skeletonPulse}
            initial="initial"
            animate="animate"
            className="h-64 bg-gray-200 rounded-xl mb-6"
          />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                variants={skeletonPulse}
                initial="initial"
                animate="animate"
                className="h-48 bg-gray-200 rounded-xl"
              />
              <motion.div
                variants={skeletonPulse}
                initial="initial"
                animate="animate"
                className="h-64 bg-gray-200 rounded-xl"
              />
            </div>
            <motion.div
              variants={skeletonPulse}
              initial="initial"
              animate="animate"
              className="h-96 bg-gray-200 rounded-xl"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Event not found</h2>
              <Button onClick={() => router.push('/events')}>Back to Events</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Header with Gradient */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-16"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <motion.div variants={fadeInUp} className="flex items-center space-x-3 mb-4">
                <Calendar className="w-12 h-12" strokeWidth={1.5} />
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm ${
                    event.status === 'upcoming'
                      ? 'bg-green-500/30'
                      : event.status === 'ongoing'
                      ? 'bg-blue-500/30'
                      : event.status === 'completed'
                      ? 'bg-gray-500/30'
                      : 'bg-red-500/30'
                  }`}
                >
                  {event.status}
                </span>
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-5xl font-bold mb-4 drop-shadow-lg">
                {event.title}
              </motion.h1>
              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-6 text-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  <span>at {event.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>{event.attendees?.length || 0} attending</span>
                </div>
              </motion.div>
              <motion.p variants={fadeInUp} className="mt-4 text-white/90">
                Organized by <span className="font-semibold">{event.organizer?.name}</span>
              </motion.p>
            </div>
            <motion.div variants={scaleIn} className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                aria-label="Share event"
              >
                <Share2 className="w-6 h-6" />
              </motion.button>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isAttending ? 'attending' : 'not-attending'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Button
                    onClick={handleRSVP}
                    variant={isAttending ? 'outline' : 'primary'}
                    className={
                      isAttending
                        ? 'bg-white text-orange-500 hover:bg-gray-100 border-white'
                        : 'bg-white text-orange-500 hover:bg-gray-100'
                    }
                  >
                    {isAttending ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Attending
                      </>
                    ) : (
                      <>
                        Join Event
                      </>
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Countdown Timer for Upcoming Events */}
          {event.status === 'upcoming' && (
            <motion.div variants={staggerItem}>
              <Card className="bg-gradient-to-r from-orange-50 to-pink-50">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Event starts in</h3>
                  <div className="flex justify-center space-x-4">
                    {[
                      { label: 'Days', value: countdown.days },
                      { label: 'Hours', value: countdown.hours },
                      { label: 'Minutes', value: countdown.minutes },
                      { label: 'Seconds', value: countdown.seconds },
                    ].map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1, type: 'spring' }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          key={item.value}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="w-20 h-20 bg-white rounded-xl shadow-md flex items-center justify-center"
                        >
                          <span className="text-3xl font-bold text-orange-500">{item.value}</span>
                        </motion.div>
                        <span className="text-sm text-gray-600 mt-2">{item.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Description */}
          {event.description && (
            <motion.div variants={staggerItem}>
              <Card>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">About this event</h2>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
              </Card>
            </motion.div>
          )}

          {/* Place Details */}
          {event.placeId && (
            <motion.div variants={staggerItem}>
              <Card className="bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center text-xl">
                      <MapPin className="w-6 h-6 mr-2 text-orange-500" />
                      Location
                    </h3>
                    <p className="text-2xl font-bold text-gray-800 mb-2">{event.placeId.name}</p>
                    <p className="text-gray-600 mb-1">{event.placeId.address}</p>
                    <p className="text-sm text-gray-500">{event.placeId.cuisine}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/places/${event.placeId._id}`)}
                    className="whitespace-nowrap"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Attendees */}
          <motion.div variants={staggerItem}>
            <Card>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Attendees ({event.attendees?.length || 0})
              </h2>

              {event.attendees && event.attendees.length > 0 ? (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {event.attendees.map((attendee: any, index: number) => (
                    <motion.div
                      key={attendee._id}
                      variants={staggerItem}
                      custom={index}
                      whileHover={{ scale: 1.05, y: -4 }}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => router.push(`/profile/${attendee.username}`)}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05, type: 'spring' }}
                        className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                      >
                        {attendee.name?.charAt(0)}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{attendee.name}</p>
                        <p className="text-sm text-gray-500 truncate">@{attendee.username}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  variants={fadeInUp}
                  className="text-center py-12 bg-gray-50 rounded-lg"
                >
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No attendees yet. Be the first to RSVP!</p>
                  {!isAttending && (
                    <Button onClick={handleRSVP}>Join This Event</Button>
                  )}
                </motion.div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
