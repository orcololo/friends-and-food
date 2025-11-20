'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Heart, Calendar, Share2, ImageIcon, X, Upload, Bookmark, Link as LinkIcon, Edit2, Trash2 } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import PhotoGallery from '@/components/ui/PhotoGallery';
import SafeContent from '@/components/ui/SafeContent';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/utils/api';
import { compressImages, isImageFile } from '@/lib/utils/imageCompression';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  scaleIn,
  popIn,
  hoverLift,
  skeletonPulse,
} from '@/lib/utils/animations';

export default function PlaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [place, setPlace] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const REVIEW_MAX_LENGTH = 1000;
  const MAX_REVIEW_IMAGES = 5;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadCurrentUser();
    loadPlaceDetails();
    loadSavedStatus();
  }, [params.id]);

  const loadCurrentUser = async () => {
    try {
      const response = await api.getMe();
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadPlaceDetails = async () => {
    try {
      setError(null);
      const data = await api.getPlace(params.id as string);
      setPlace(data.data.place);
      setReviews(data.data.reviews || []);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load place';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Failed to load place:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedStatus = async () => {
    try {
      const response = await api.getSavedPlaces();
      const savedPlaces = response.data.places || [];
      const placeId = params.id as string;
      const isPlaceSaved = savedPlaces.some((p: any) => p._id === placeId);
      setIsSaved(isPlaceSaved);
    } catch (error) {
      console.error('Failed to load saved status:', error);
      // Don't show error toast, as this is not critical
    }
  };

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
    const totalImages = reviewImages.length + files.length;
    if (totalImages > MAX_REVIEW_IMAGES) {
      showToast(`Maximum ${MAX_REVIEW_IMAGES} images allowed`, 'warning');
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

      setReviewImages(prev => [...prev, ...compressedFiles]);
      setReviewImagePreviews(prev => [...prev, ...newPreviews]);
    } catch (error) {
      showToast('Failed to process images', 'error');
    }
  };

  const handleRemoveImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
    setReviewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadReviewImages = async (): Promise<string[]> => {
    if (reviewImages.length === 0) return [];

    try {
      setIsUploadingImages(true);
      const formData = new FormData();
      reviewImages.forEach(file => {
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

  const handleSubmitReview = async () => {
    if (!reviewData.comment.trim()) {
      showToast('Please add a comment to your review', 'warning');
      return;
    }

    try {
      setIsSubmittingReview(true);

      // Upload images first if any
      let imageUrls: string[] = [];
      if (reviewImages.length > 0) {
        imageUrls = await uploadReviewImages();
      }

      if (editingReview) {
        // Update existing review
        await api.updateReview(editingReview._id, {
          rating: reviewData.rating,
          comment: reviewData.comment,
          images: imageUrls.length > 0 ? imageUrls : editingReview.images,
        });
        showToast('Review updated successfully!', 'success');
      } else {
        // Create new review
        await api.createReview({
          placeId: params.id,
          rating: reviewData.rating,
          comment: reviewData.comment,
          images: imageUrls,
        });
        showToast('Review submitted successfully!', 'success');
      }

      setShowReviewModal(false);
      setEditingReview(null);
      setReviewData({ rating: 5, comment: '' });
      setReviewImages([]);
      setReviewImagePreviews([]);
      setHoverRating(0);
      loadPlaceDetails();
    } catch (error: any) {
      showToast(error.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setReviewData({
      rating: review.rating,
      comment: review.comment || '',
    });
    // Set existing images as previews
    setReviewImagePreviews(review.images || []);
    setShowReviewModal(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await api.deleteReview(reviewId);
      showToast('Review deleted successfully!', 'success');
      setShowDeleteConfirm(null);
      loadPlaceDetails();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete review', 'error');
    }
  };

  const handleToggleBookmark = async () => {
    const placeId = params.id as string;
    const wasSaved = isSaved;

    // Optimistic update
    setIsSaved(!isSaved);

    try {
      if (wasSaved) {
        await api.unsavePlace(placeId);
        showToast('Removed from saved places', 'success');
      } else {
        await api.savePlace(placeId);
        showToast('Place saved!', 'success');
      }
    } catch (error: any) {
      // Revert on error
      setIsSaved(wasSaved);
      showToast(error.message || 'Failed to update saved place', 'error');
    }
  };

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: place?.name,
        text: `Check out ${place?.name} on Friends & Food!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    }
  }, [place, showToast]);

  const handleCopyMapLink = useCallback(() => {
    if (!place?.location?.coordinates) {
      showToast('Location coordinates not available', 'error');
      return;
    }

    // Google Maps link format: https://www.google.com/maps?q=lat,lng
    const [lng, lat] = place.location.coordinates;
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    navigator.clipboard.writeText(mapUrl);
    showToast('Map link copied to clipboard!', 'success');
  }, [place, showToast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          {/* Hero Skeleton */}
          <motion.div
            variants={skeletonPulse}
            initial="initial"
            animate="animate"
            className="h-96 bg-gray-200 rounded-xl mb-6"
          />
          {/* Content Skeleton */}
          <div className="space-y-6">
            <motion.div
              variants={skeletonPulse}
              initial="initial"
              animate="animate"
              className="h-32 bg-gray-200 rounded-xl"
            />
            <motion.div
              variants={skeletonPulse}
              initial="initial"
              animate="animate"
              className="h-64 bg-gray-200 rounded-xl"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Place not found</h2>
              <Button onClick={() => router.push('/places')}>Back to Places</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Image Section with Gradient Overlay */}
      {place.images && place.images.length > 0 ? (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="relative h-96 overflow-hidden"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${place.images[0]})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="container mx-auto">
              <motion.h1
                variants={fadeInUp}
                className="text-5xl font-bold mb-3 drop-shadow-lg"
              >
                {place.name}
              </motion.h1>
              <motion.div
                variants={fadeInUp}
                className="flex items-center space-x-4 text-lg mb-2"
              >
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                  {place.cuisine}
                </span>
                <span>{'$'.repeat(place.priceRange)}</span>
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-semibold">{place.averageRating.toFixed(1)}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="h-32 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />
      )}

      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Quick Actions Bar */}
          <motion.div variants={staggerItem}>
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{place.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyMapLink}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Copy map link"
                    title="Copy Google Maps link"
                  >
                    <LinkIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Share"
                  >
                    <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggleBookmark}
                    className={`p-2 rounded-full transition-all ${
                      isSaved
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    aria-label={isSaved ? 'Remove from saved places' : 'Save place'}
                  >
                    <Bookmark
                      className={`w-5 h-5 ${isSaved ? 'fill-white' : ''}`}
                    />
                  </motion.button>
                  <Button onClick={() => setShowReviewModal(true)}>
                    <Star className="w-4 h-4 mr-2" />
                    Write Review
                  </Button>
                  <Button variant="secondary" onClick={() => router.push('/events/create')}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Description */}
          {place.description && (
            <motion.div variants={staggerItem}>
              <Card>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">About</h2>
                <p className="text-gray-700 leading-relaxed">{place.description}</p>
                <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                  Added by <span className="font-medium text-gray-700">{place.createdBy?.name || 'Unknown'}</span>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Photo Gallery */}
          {place.images && place.images.length > 0 && (
            <motion.div variants={staggerItem}>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Photos ({place.images.length})
                  </h2>
                  <button
                    onClick={() => setShowGalleryModal(true)}
                    className="text-orange-500 hover:text-orange-600 font-medium flex items-center"
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    View All
                  </button>
                </div>
                <PhotoGallery images={place.images} alt={place.name} />
              </Card>
            </motion.div>
          )}

          {/* Reviews */}
          <motion.div variants={staggerItem}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Reviews ({reviews.length})
                </h2>
              </div>

              {reviews.length === 0 ? (
                <motion.div
                  variants={fadeInUp}
                  className="text-center py-12 bg-gray-50 rounded-lg"
                >
                  <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No reviews yet. Be the first!</p>
                  <Button onClick={() => setShowReviewModal(true)}>Write First Review</Button>
                </motion.div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-4"
                >
                  {reviews.map((review, index) => (
                    <motion.div
                      key={review._id}
                      variants={staggerItem}
                      custom={index}
                      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                      className="border-b pb-4 last:border-b-0 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                          >
                            {review.userId?.name?.charAt(0)}
                          </motion.div>
                          <div>
                            <p className="font-semibold text-gray-800 text-lg">
                              {review.userId?.name}
                            </p>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: i * 0.05 }}
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-500 text-yellow-500'
                                        : 'fill-gray-300 text-gray-300'
                                    }`}
                                  />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                          {currentUser && review.userId?._id === currentUser._id && (
                            <div className="flex items-center space-x-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditReview(review)}
                                className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                                title="Edit review"
                              >
                                <Edit2 className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowDeleteConfirm(review._id)}
                                className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                                title="Delete review"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>
                      {review.comment && (
                        <SafeContent
                          content={review.comment}
                          maxLength={1000}
                          as="p"
                          className="text-gray-700 ml-15 break-words leading-relaxed"
                        />
                      )}
                      {review.images && review.images.length > 0 && (
                        <div className="mt-3 ml-15 grid grid-cols-3 gap-2">
                          {review.images.slice(0, 3).map((image: string, idx: number) => (
                            <motion.img
                              key={idx}
                              src={image}
                              alt={`Review image ${idx + 1}`}
                              className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              whileHover={{ scale: 1.05 }}
                              onClick={() => {
                                setLightboxImages(review.images);
                                setLightboxIndex(idx);
                                setShowLightbox(true);
                              }}
                            />
                          ))}
                          {review.images.length > 3 && (
                            <div
                              className="relative cursor-pointer"
                              onClick={() => {
                                setLightboxImages(review.images);
                                setLightboxIndex(3);
                                setShowLightbox(true);
                              }}
                            >
                              <img
                                src={review.images[3]}
                                alt="More images"
                                className="w-full aspect-square object-cover rounded-lg opacity-70"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                <span className="text-white font-bold text-lg">
                                  +{review.images.length - 3}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setEditingReview(null);
          setHoverRating(0);
          setReviewData({ rating: 5, comment: '' });
          setReviewImages([]);
          setReviewImagePreviews([]);
        }}
        title={editingReview ? 'Edit Review' : 'Write a Review'}
      >
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          <motion.div variants={staggerItem}>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rating {hoverRating > 0 && `(${hoverRating} star${hoverRating > 1 ? 's' : ''})`}
            </label>
            <div className="flex space-x-2 items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  onClick={() => setReviewData({ ...reviewData, rating: star })}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                >
                  <Star
                    className={`w-10 h-10 transition-all ${
                      star <= (hoverRating || reviewData.rating)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'fill-gray-300 text-gray-300'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={staggerItem}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Comment</label>
              <span
                className={`text-xs ${
                  reviewData.comment.length >= REVIEW_MAX_LENGTH ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {reviewData.comment.length}/{REVIEW_MAX_LENGTH}
              </span>
            </div>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              rows={5}
              placeholder="Share your experience... What did you love? What could be better?"
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
              maxLength={REVIEW_MAX_LENGTH}
            />
          </motion.div>

          {/* Image Upload */}
          <motion.div variants={staggerItem}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos ({reviewImages.length}/{MAX_REVIEW_IMAGES})
            </label>
            <div className="space-y-3">
              {/* Image Previews */}
              {reviewImagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {reviewImagePreviews.map((preview, index) => (
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
              {reviewImages.length < MAX_REVIEW_IMAGES && (
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {reviewImages.length === 0 ? 'Add Photos' : 'Add More Photos'}
                    </span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={isSubmittingReview || isUploadingImages}
                  />
                </label>
              )}
              <p className="text-xs text-gray-500">
                Accepted: JPEG, PNG, GIF, WebP (max {MAX_REVIEW_IMAGES} images, 5MB each)
              </p>
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="flex space-x-3 pt-4">
            <Button
              onClick={handleSubmitReview}
              className="flex-1"
              isLoading={isSubmittingReview}
              disabled={isSubmittingReview || !reviewData.comment.trim()}
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button
              onClick={() => {
                setShowReviewModal(false);
                setEditingReview(null);
                setHoverRating(0);
                setReviewData({ rating: 5, comment: '' });
                setReviewImages([]);
                setReviewImagePreviews([]);
              }}
              variant="outline"
              className="flex-1"
              disabled={isSubmittingReview}
            >
              Cancel
            </Button>
          </motion.div>
        </motion.div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Review"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this review? This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              onClick={() => handleDeleteReview(showDeleteConfirm!)}
              variant="danger"
              className="flex-1"
            >
              Delete
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(null)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        isOpen={showLightbox}
        currentIndex={lightboxIndex}
        onClose={() => setShowLightbox(false)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
