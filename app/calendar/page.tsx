'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                Events Calendar
              </h1>
              <p className="text-gray-600">Plan and manage your dining events</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => router.push('/events')}>View All Events</Button>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card className="p-6 shadow-xl border border-gray-200">
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-xl border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Events on {selectedDate.toLocaleDateString()}
                </h2>

                {selectedDateEvents.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 text-gray-500"
                  >
                    <CalendarIcon className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                    <p>No events on this date</p>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={{
                      initial: {},
                      animate: { transition: { staggerChildren: 0.1 } }
                    }}
                    initial="initial"
                    animate="animate"
                    className="space-y-3"
                  >
                    {selectedDateEvents.map((event, index) => (
                      <motion.div
                        key={event._id}
                        variants={{
                          initial: { opacity: 0, x: -20 },
                          animate: { opacity: 1, x: 0 }
                        }}
                        whileHover={{ x: 4, scale: 1.01 }}
                        onClick={() => router.push(`/events/${event._id}`)}
                        className="p-5 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl hover:shadow-lg cursor-pointer transition-all border border-gray-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl">
                            <CalendarIcon className="w-8 h-8 text-white" strokeWidth={2} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 text-lg">{event.title}</p>
                            <p className="text-sm text-gray-600 font-medium">{event.placeId?.name}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {event.time} • {event.attendees?.length || 0} attending
                            </p>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                              event.status === 'upcoming'
                                ? 'bg-green-100 text-green-800'
                                : event.status === 'ongoing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {event.status}
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </Card>
            </motion.div>
          </motion.div>

          {/* Sidebar - Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="shadow-xl border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 text-xl">Upcoming Events</h3>
              <div className="space-y-3">
                {events
                  .filter((e) => new Date(e.date) >= new Date() && e.status === 'upcoming')
                  .slice(0, 5)
                  .map((event, index) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ x: 4, backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                      onClick={() => router.push(`/events/${event._id}`)}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer transition-all"
                    >
                      <p className="font-semibold text-gray-800 text-sm">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </p>
                    </motion.div>
                  ))}
              </div>
            </Card>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 text-xl">Calendar Stats</h3>
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex justify-between p-3 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg"
                  >
                    <span className="text-gray-600 font-medium">Total Events</span>
                    <span className="font-bold text-gray-800 text-lg">{events.length}</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex justify-between p-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg"
                  >
                    <span className="text-gray-600 font-medium">Upcoming</span>
                    <span className="font-bold text-green-600 text-lg">
                      {events.filter((e) => e.status === 'upcoming').length}
                    </span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex justify-between p-3 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg"
                  >
                    <span className="text-gray-600 font-medium">This Month</span>
                    <span className="font-bold text-orange-600 text-lg">
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
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
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
