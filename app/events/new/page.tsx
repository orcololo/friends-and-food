'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/utils/api';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
} from '@/lib/utils/animations';

export default function NewEventPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    placeId: '',
    date: '',
    time: '',
  });

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadPlaces();
  }, [isAuthenticated, authLoading, router]);

  const loadPlaces = async () => {
    try {
      setIsLoadingPlaces(true);
      const response = await api.getPlaces(1, 100); // Get first 100 places
      setPlaces(response.data.places || []);
    } catch (error: any) {
      showToast('Failed to load places', 'error');
      console.error('Failed to load places:', error);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      showToast('Please enter an event title', 'warning');
      return;
    }

    if (!formData.placeId) {
      showToast('Please select a place', 'warning');
      return;
    }

    if (!formData.date) {
      showToast('Please select a date', 'warning');
      return;
    }

    if (!formData.time) {
      showToast('Please select a time', 'warning');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(`${formData.date}T${formData.time}`);
    const now = new Date();
    if (selectedDate < now) {
      showToast('Event date and time must be in the future', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await api.createEvent({
        title: formData.title,
        description: formData.description,
        placeId: formData.placeId,
        date: formData.date,
        time: formData.time,
      });

      showToast('Event created successfully!', 'success');
      router.push(`/events/${response.data._id}`);
    } catch (error: any) {
      showToast(error.message || 'Failed to create event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Create New Event</h1>
          <p className="text-gray-600 mb-8">Plan a dining experience with friends</p>

          <Card shadow="lg" padding="lg">
            <form onSubmit={handleSubmit}>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-6"
              >
                {/* Event Title */}
                <motion.div variants={staggerItem}>
                  <Input
                    label="Event Title"
                    placeholder="e.g., Sunday Brunch with Friends"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </motion.div>

                {/* Description */}
                <motion.div variants={staggerItem}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Add event details, special instructions, or what to expect..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    maxLength={500}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500">
                      {formData.description.length}/500
                    </span>
                  </div>
                </motion.div>

                {/* Place Selection */}
                <motion.div variants={staggerItem}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  {isLoadingPlaces ? (
                    <div className="flex items-center justify-center py-8">
                      <motion.div
                        className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <select
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                        value={formData.placeId}
                        onChange={(e) => handleInputChange('placeId', e.target.value)}
                        required
                      >
                        <option value="">Select a place...</option>
                        {places.map(place => (
                          <option key={place._id} value={place._id}>
                            {place.name} - {place.cuisine}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {places.length === 0 && !isLoadingPlaces && (
                    <div className="mt-2 text-sm text-gray-600">
                      No places found.{' '}
                      <button
                        type="button"
                        onClick={() => router.push('/places/new')}
                        className="text-orange-500 hover:text-orange-600 font-medium"
                      >
                        Create a place first
                      </button>
                    </div>
                  )}
                </motion.div>

                {/* Date and Time */}
                <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        min={getMinDate()}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input
                        type="time"
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        value={formData.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Submit Buttons */}
                <motion.div variants={staggerItem} className="flex space-x-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isSubmitting}
                    disabled={isSubmitting || isLoadingPlaces}
                  >
                    {isSubmitting ? 'Creating Event...' : 'Create Event'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.push('/events')}
                    variant="outline"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
