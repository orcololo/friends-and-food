'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadEvents();
  }, []);

  useEffect(() => {
    // Filter events for selected date
    const dayEvents = events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
    });
    setSelectedDateEvents(dayEvents);
  }, [selectedDate, events]);

  const loadEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/events?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setEvents(data.data.events);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tileContent = ({ date, view }: any) => {
    if (view === 'month') {
      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      });

      if (dayEvents.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
          </div>
        );
      }
    }
    return null;
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Events Calendar</h1>
            <Button onClick={() => router.push('/events')}>View All Events</Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <Calendar
                  onChange={(value: any) => {
                    setSelectedDate(value);
                    setShowEventModal(true);
                  }}
                  value={selectedDate}
                  tileContent={tileContent}
                  className="w-full border-none"
                />
              </Card>

              <div className="mt-6">
                <Card>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Events on {selectedDate.toLocaleDateString()}
                  </h2>

                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No events on this date
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateEvents.map((event) => (
                        <div
                          key={event._id}
                          onClick={() => router.push(`/events/${event._id}`)}
                          className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-3xl">📅</div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{event.title}</p>
                              <p className="text-sm text-gray-600">{event.placeId?.name}</p>
                              <p className="text-sm text-gray-500">
                                {event.time} • {event.attendees?.length || 0} attending
                              </p>
                            </div>
                            <div
                              className={`px-3 py-1 rounded text-sm ${
                                event.status === 'upcoming'
                                  ? 'bg-green-100 text-green-800'
                                  : event.status === 'ongoing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {event.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* Sidebar - Upcoming Events */}
            <div className="space-y-6">
              <Card>
                <h3 className="font-semibold text-gray-800 mb-4">Upcoming Events</h3>
                <div className="space-y-3">
                  {events
                    .filter((e) => new Date(e.date) >= new Date() && e.status === 'upcoming')
                    .slice(0, 5)
                    .map((event) => (
                      <div
                        key={event._id}
                        onClick={() => router.push(`/events/${event._id}`)}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <p className="font-medium text-gray-800 text-sm">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString()} at {event.time}
                        </p>
                      </div>
                    ))}
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-gray-800 mb-3">Calendar Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Events</span>
                    <span className="font-bold text-gray-800">{events.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upcoming</span>
                    <span className="font-bold text-green-600">
                      {events.filter((e) => e.status === 'upcoming').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Month</span>
                    <span className="font-bold text-orange-600">
                      {
                        events.filter((e) => {
                          const eventDate = new Date(e.date);
                          const now = new Date();
                          return (
                            eventDate.getMonth() === now.getMonth() &&
                            eventDate.getFullYear() === now.getFullYear()
                          );
                        }).length
                      }
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Event Details Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={`Events on ${selectedDate.toLocaleDateString()}`}
      >
        {selectedDateEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No events on this date</div>
        ) : (
          <div className="space-y-3">
            {selectedDateEvents.map((event) => (
              <div
                key={event._id}
                onClick={() => {
                  setShowEventModal(false);
                  router.push(`/events/${event._id}`);
                }}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <p className="font-semibold text-gray-800">{event.title}</p>
                <p className="text-sm text-gray-600">{event.placeId?.name}</p>
                <p className="text-sm text-gray-500">
                  {event.time} • {event.attendees?.length || 0} attending
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .react-calendar {
          width: 100% !important;
          border: none !important;
          font-family: inherit !important;
        }
        .react-calendar__tile--active {
          background: #f97316 !important;
          color: white !important;
        }
        .react-calendar__tile--now {
          background: #fed7aa !important;
        }
        .react-calendar__tile:enabled:hover {
          background: #ffedd5 !important;
        }
      `}</style>
    </div>
  );
}
