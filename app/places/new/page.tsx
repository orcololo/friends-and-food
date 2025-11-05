'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Upload, X, DollarSign } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/utils/api';
import { compressImages, isImageFile } from '@/lib/utils/imageCompression';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
} from '@/lib/utils/animations';

const cuisineTypes = [
  'Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian', 'Thai',
  'French', 'American', 'Mediterranean', 'Brazilian', 'Korean',
  'Vietnamese', 'Greek', 'Spanish', 'Middle Eastern', 'Other'
];

export default function NewPlacePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [placeImages, setPlaceImages] = useState<File[]>([]);
  const [placeImagePreviews, setPlaceImagePreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    cuisine: '',
    priceRange: 2,
  });

  const MAX_PLACE_IMAGES = 10;

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Validate file types
    const invalidFiles = files.filter(file => !isImageFile(file));
    if (invalidFiles.length > 0) {
      showToast('Please select only image files (JPEG, PNG, GIF, WebP)', 'error');
      return;
    }

    // Check total count
    const totalImages = placeImages.length + files.length;
    if (totalImages > MAX_PLACE_IMAGES) {
      showToast(`Maximum ${MAX_PLACE_IMAGES} images allowed`, 'warning');
      return;
    }

    try {
      // Compress images
      const compressedFiles = await compressImages(files);

      // Create previews
      const newPreviews = await Promise.all(
        compressedFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      );

      setPlaceImages(prev => [...prev, ...compressedFiles]);
      setPlaceImagePreviews(prev => [...prev, ...newPreviews]);
    } catch (error) {
      showToast('Failed to process images', 'error');
    }
  };

  const handleRemoveImage = (index: number) => {
    setPlaceImages(prev => prev.filter((_, i) => i !== index));
    setPlaceImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPlaceImages = async (): Promise<string[]> => {
    if (placeImages.length === 0) return [];

    try {
      setIsUploadingImages(true);
      const formData = new FormData();
      placeImages.forEach(file => {
        formData.append('files', file);
      });

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/multiple', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload images');
      }

      return data.data.files.map((file: any) => file.url);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload images');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      showToast('Please enter a place name', 'warning');
      return;
    }

    if (!formData.address.trim()) {
      showToast('Please enter an address', 'warning');
      return;
    }

    if (!formData.cuisine) {
      showToast('Please select a cuisine type', 'warning');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      showToast('Please enter location coordinates', 'warning');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      showToast('Invalid coordinates. Please enter valid numbers', 'error');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showToast('Coordinates out of range. Latitude: -90 to 90, Longitude: -180 to 180', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload images first if any
      let imageUrls: string[] = [];
      if (placeImages.length > 0) {
        imageUrls = await uploadPlaceImages();
      }

      // Create place
      const response = await api.createPlace({
        name: formData.name,
        description: formData.description,
        address: formData.address,
        location: {
          type: 'Point',
          coordinates: [lng, lat], // [longitude, latitude]
        },
        cuisine: formData.cuisine,
        priceRange: formData.priceRange,
        images: imageUrls,
      });

      showToast('Place created successfully!', 'success');
      router.push(`/places/${response.data.place._id}`);
    } catch (error: any) {
      showToast(error.message || 'Failed to create place', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGetMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    showToast('Getting your location...', 'info');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        showToast('Location retrieved successfully!', 'success');
      },
      (error) => {
        let message = 'Failed to get location';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. Please enable location access.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information unavailable';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out';
        }
        showToast(message, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Add New Place</h1>
          <p className="text-gray-600 mb-8">Share a great dining spot with the community</p>

          <Card shadow="lg" padding="lg">
            <form onSubmit={handleSubmit}>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-6"
              >
                {/* Place Name */}
                <motion.div variants={staggerItem}>
                  <Input
                    label="Place Name"
                    placeholder="e.g., The Golden Dragon"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
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
                    placeholder="Tell us about this place..."
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

                {/* Address */}
                <motion.div variants={staggerItem}>
                  <Input
                    label="Address"
                    placeholder="123 Main St, City, State"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    leftIcon={<MapPin className="w-5 h-5" />}
                    required
                  />
                </motion.div>

                {/* Coordinates */}
                <motion.div variants={staggerItem}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Location Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={handleGetMyLocation}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center space-x-1"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Use My Location</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Latitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 0.0349"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      required
                    />
                    <Input
                      label="Longitude"
                      type="number"
                      step="any"
                      placeholder="e.g., -51.0694"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Tip: Find coordinates on <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Google Maps</a> by right-clicking a location, or use your current location
                  </p>
                </motion.div>

                {/* Cuisine Type */}
                <motion.div variants={staggerItem}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Type
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={formData.cuisine}
                    onChange={(e) => handleInputChange('cuisine', e.target.value)}
                    required
                  >
                    <option value="">Select cuisine type...</option>
                    {cuisineTypes.map(cuisine => (
                      <option key={cuisine} value={cuisine}>
                        {cuisine}
                      </option>
                    ))}
                  </select>
                </motion.div>

                {/* Price Range */}
                <motion.div variants={staggerItem}>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Price Range
                  </label>
                  <div className="flex items-center space-x-4">
                    {[1, 2, 3, 4].map((price) => (
                      <button
                        key={price}
                        type="button"
                        onClick={() => handleInputChange('priceRange', price)}
                        className={`flex items-center px-4 py-2 rounded-lg border-2 transition-all ${
                          formData.priceRange === price
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-gray-300 hover:border-orange-300'
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                        {price > 1 && (
                          <>
                            {Array(price - 1)
                              .fill(0)
                              .map((_, i) => (
                                <DollarSign key={i} className="w-4 h-4" />
                              ))}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    $ = Budget, $$ = Moderate, $$$ = Upscale, $$$$ = Fine Dining
                  </p>
                </motion.div>

                {/* Images */}
                <motion.div variants={staggerItem}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos ({placeImages.length}/{MAX_PLACE_IMAGES})
                  </label>
                  <div className="space-y-3">
                    {/* Image Previews */}
                    {placeImagePreviews.length > 0 && (
                      <div className="grid grid-cols-4 gap-3">
                        {placeImagePreviews.map((preview, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                          >
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Upload Button */}
                    {placeImages.length < MAX_PLACE_IMAGES && (
                      <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all">
                        <div className="flex flex-col items-center space-y-2 text-gray-600">
                          <Upload className="w-8 h-8" />
                          <span className="text-sm font-medium">
                            {placeImages.length === 0 ? 'Upload Photos' : 'Add More Photos'}
                          </span>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          disabled={isSubmitting || isUploadingImages}
                        />
                      </label>
                    )}
                    <p className="text-xs text-gray-500">
                      Accepted: JPEG, PNG, GIF, WebP (max {MAX_PLACE_IMAGES} images, 5MB each)
                    </p>
                  </div>
                </motion.div>

                {/* Submit Buttons */}
                <motion.div variants={staggerItem} className="flex space-x-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isSubmitting || isUploadingImages}
                    disabled={isSubmitting || isUploadingImages}
                  >
                    {isUploadingImages
                      ? 'Uploading Images...'
                      : isSubmitting
                      ? 'Creating Place...'
                      : 'Create Place'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.push('/places')}
                    variant="outline"
                    className="flex-1"
                    disabled={isSubmitting || isUploadingImages}
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
