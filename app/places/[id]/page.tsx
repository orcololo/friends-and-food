'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { api } from '@/lib/utils/api';

export default function PlaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [place, setPlace] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

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
      const data = await api.getPlace(params.id as string);
      setPlace(data.data.place);
      setReviews(data.data.reviews || []);
    } catch (error) {
      console.error('Failed to load place:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      await api.createReview({
        placeId: params.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      setShowReviewModal(false);
      setReviewData({ rating: 5, comment: '' });
      loadPlaceDetails();
    } catch (error: any) {
      alert(error.message || 'Failed to submit review');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
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

      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <Card className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">{place.name}</h1>
                <div className="flex items-center space-x-4 text-gray-600 mb-4">
                  <span className="text-lg">{place.cuisine}</span>
                  <span>•</span>
                  <span>{'$'.repeat(place.priceRange)}</span>
                  <span>•</span>
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    <span className="font-semibold">{place.averageRating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">📍 {place.address}</p>
                <p className="text-sm text-gray-500">
                  Added by {place.createdBy?.name || 'Unknown'}
                </p>
              </div>
              <div className="space-x-2">
                <Button onClick={() => setShowReviewModal(true)}>Write Review</Button>
                <Button variant="secondary">Create Event</Button>
              </div>
            </div>

            {place.description && (
              <p className="text-gray-700 mt-4">{place.description}</p>
            )}
          </Card>

          {/* Images */}
          {place.images && place.images.length > 0 && (
            <Card className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {place.images.map((image: string, index: number) => (
                  <div
                    key={index}
                    className="aspect-video bg-gray-200 rounded-lg overflow-hidden"
                  >
                    <img
                      src={image}
                      alt={`${place.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Reviews ({reviews.length})
              </h2>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No reviews yet. Be the first!</p>
                <Button onClick={() => setShowReviewModal(true)}>Write First Review</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                          {review.userId?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {review.userId?.name}
                          </p>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={
                                  i < review.rating ? 'text-yellow-500' : 'text-gray-300'
                                }
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 ml-13">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Write a Review"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewData({ ...reviewData, rating: star })}
                  className="text-3xl focus:outline-none"
                >
                  <span className={star <= reviewData.rating ? 'text-yellow-500' : 'text-gray-300'}>
                    ⭐
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={4}
              placeholder="Share your experience..."
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSubmitReview} className="flex-1">
              Submit Review
            </Button>
            <Button
              onClick={() => setShowReviewModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
