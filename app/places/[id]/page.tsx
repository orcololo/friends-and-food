'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Heart, Calendar, Share2, ImageIcon } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import PhotoGallery from '@/components/ui/PhotoGallery';
import SafeContent from '@/components/ui/SafeContent';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/utils/api';
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
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const REVIEW_MAX_LENGTH = 1000;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadPlaceDetails();
  }, [params.id]);

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

  const handleSubmitReview = async () => {
    if (!reviewData.comment.trim()) {
      showToast('Please add a comment to your review', 'warning');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await api.createReview({
        placeId: params.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      showToast('Review submitted successfully!', 'success');
      setShowReviewModal(false);
      setReviewData({ rating: 5, comment: '' });
      setHoverRating(0);
      loadPlaceDetails();
    } catch (error: any) {
      showToast(error.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleToggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
    showToast(isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success');
  }, [isFavorite, showToast]);

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
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Share"
                  >
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggleFavorite}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                      }`}
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
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <SafeContent
                          content={review.comment}
                          maxLength={1000}
                          as="p"
                          className="text-gray-700 ml-15 break-words leading-relaxed"
                        />
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
          setHoverRating(0);
        }}
        title="Write a Review"
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
                setHoverRating(0);
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
    </div>
  );
}
