'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api } from '@/lib/utils/api';

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);

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
      } else {
        await api.attendEvent(params.id as string);
      }
      loadEventDetails();
    } catch (error: any) {
      alert(error.message || 'Failed to update RSVP');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
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

      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <Card className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 flex-1">
                <div className="text-6xl">📅</div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">{event.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <span>🕐</span>
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      <span>at {event.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>👥</span>
                      <span>{event.attendees?.length || 0} attending</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        event.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                        event.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">
                    Organized by {event.organizer?.name}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleRSVP}
                variant={isAttending ? 'outline' : 'primary'}
              >
                {isAttending ? 'Leave Event' : 'RSVP'}
              </Button>
            </div>

            {event.description && (
              <p className="text-gray-700 mb-4">{event.description}</p>
            )}

            {/* Place Details */}
            {event.placeId && (
              <div className="bg-orange-50 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">📍 Location</h3>
                <p className="text-lg font-medium text-gray-800">{event.placeId.name}</p>
                <p className="text-gray-600">{event.placeId.address}</p>
                <p className="text-sm text-gray-500 mt-1">{event.placeId.cuisine}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => router.push(`/places/${event.placeId._id}`)}
                >
                  View Place Details
                </Button>
              </div>
            )}
          </Card>

          {/* Attendees */}
          <Card>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Attendees ({event.attendees?.length || 0})
            </h2>

            {event.attendees && event.attendees.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {event.attendees.map((attendee: any) => (
                  <div
                    key={attendee._id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {attendee.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{attendee.name}</p>
                      <p className="text-sm text-gray-500">@{attendee.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No attendees yet. Be the first to RSVP!</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
