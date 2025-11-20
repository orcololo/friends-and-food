'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Globe, Lock, Image as ImageIcon, Upload } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/utils/api';
import { compressImages } from '@/lib/utils/imageCompression';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
} from '@/lib/utils/animations';

export default function NewGroupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error');
      return;
    }

    try {
      // Compress image
      const [compressedFile] = await compressImages([file]);
      setCoverImage(compressedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      showToast('Failed to process image', 'error');
    }
  };

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverImage) return null;

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append('file', coverImage);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }

      return data.data.url;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      showToast('Please enter a group name', 'warning');
      return;
    }

    if (formData.name.length < 3) {
      showToast('Group name must be at least 3 characters', 'warning');
      return;
    }

    if (formData.name.length > 50) {
      showToast('Group name must not exceed 50 characters', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload cover image if provided
      let coverImageUrl = '';
      if (coverImage) {
        const uploadedUrl = await uploadCoverImage();
        if (uploadedUrl) {
          coverImageUrl = uploadedUrl;
        }
      }

      const groupData: any = {
        name: formData.name,
        description: formData.description,
        isPrivate: formData.isPrivate,
      };

      if (coverImageUrl) {
        groupData.coverImage = coverImageUrl;
      }

      const response = await api.createGroup(groupData);

      showToast('Group created successfully!', 'success');
      router.push(`/groups/${response.data._id}`);
    } catch (error: any) {
      showToast(error.message || 'Failed to create group', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={staggerItem} className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Create a Group</h1>
            <p className="text-gray-600">Start your own food community</p>
          </motion.div>

          {/* Form */}
          <motion.div variants={staggerItem}>
            <Card>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Group Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter group name"
                    maxLength={50}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.name.length}/50 characters
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What is your group about?"
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Privacy Setting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Privacy
                  </label>
                  <div className="space-y-3">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData({ ...formData, isPrivate: false })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        !formData.isPrivate
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start">
                        <input
                          type="radio"
                          checked={!formData.isPrivate}
                          onChange={() => setFormData({ ...formData, isPrivate: false })}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-gray-800">Public</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Anyone can discover and join this group
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData({ ...formData, isPrivate: true })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.isPrivate
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start">
                        <input
                          type="radio"
                          checked={formData.isPrivate}
                          onChange={() => setFormData({ ...formData, isPrivate: true })}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Lock className="w-5 h-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-800">Private</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Only members you invite can join this group
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="w-4 h-4 inline mr-1" />
                    Cover Image (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {coverImagePreview ? (
                      <div className="relative">
                        <img
                          src={coverImagePreview}
                          alt="Cover preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImage(null);
                            setCoverImagePreview('');
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 mb-2">Upload a cover image</p>
                        <p className="text-sm text-gray-500 mb-4">PNG, JPG up to 5MB</p>
                        <label className="inline-block">
                          <span className="px-4 py-2 bg-orange-500 text-white rounded-lg cursor-pointer hover:bg-orange-600 transition-colors">
                            Choose Image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            disabled={isSubmitting || isUploadingImage}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isSubmitting || isUploadingImage}
                    disabled={isSubmitting || isUploadingImage}
                  >
                    {isSubmitting || isUploadingImage ? 'Creating...' : 'Create Group'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting || isUploadingImage}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
