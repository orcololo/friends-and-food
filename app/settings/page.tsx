'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, MapPin, Image as ImageIcon, Upload, Save, Loader2, Camera } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/utils/api';
import { compressImages } from '@/lib/utils/imageCompression';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/utils/animations';

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    location: '',
  });
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await api.getMe();
      const userData = response.data;
      setCurrentUser(userData);
      setFormData({
        name: userData.name || '',
        username: userData.username || '',
        email: userData.email || '',
        bio: userData.bio || '',
        location: userData.location?.coordinates ?
          `${userData.location.coordinates[1]}, ${userData.location.coordinates[0]}` : '',
      });
      setProfileImagePreview(userData.profileImage || '');
    } catch (error: any) {
      showToast(error.message || 'Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
      setSelectedImage(compressedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      showToast('Failed to process image', 'error');
    }
  };

  const uploadProfileImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append('file', selectedImage);

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

    if (!formData.name.trim()) {
      showToast('Name is required', 'warning');
      return;
    }

    if (!formData.username.trim()) {
      showToast('Username is required', 'warning');
      return;
    }

    try {
      setIsSaving(true);

      // Upload profile image if changed
      let profileImageUrl = currentUser.profileImage;
      if (selectedImage) {
        const uploadedUrl = await uploadProfileImage();
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      }

      // Parse location coordinates if provided
      let locationData = undefined;
      if (formData.location.trim()) {
        const coords = formData.location.split(',').map(c => parseFloat(c.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          locationData = {
            type: 'Point',
            coordinates: [coords[1], coords[0]], // [lng, lat]
          };
        }
      }

      // Update user profile
      const updateData: any = {
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
      };

      if (profileImageUrl) {
        updateData.profileImage = profileImageUrl;
      }

      if (locationData) {
        updateData.location = locationData;
      }

      await api.updateUser(currentUser._id, updateData);

      showToast('Profile updated successfully!', 'success');
      setSelectedImage(null);

      // Reload user data
      loadCurrentUser();
    } catch (error: any) {
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
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
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Update your profile information</p>
          </motion.div>

          {/* Profile Form */}
          <motion.div variants={staggerItem}>
            <Card>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white shadow-lg"
                    >
                      {profileImagePreview ? (
                        <img
                          src={profileImagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl font-bold">
                          {formData.name.charAt(0) || 'U'}
                        </span>
                      )}
                    </motion.div>
                    <label
                      htmlFor="profile-image"
                      className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full cursor-pointer hover:bg-orange-600 transition-colors shadow-lg"
                    >
                      <Camera className="w-5 h-5" />
                      <input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={isSaving || isUploadingImage}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Click the camera icon to change your profile picture
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Name
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Username
                  </label>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Your username"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your profile URL will be: /profile/{formData.username || 'username'}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Latitude, Longitude (e.g., 40.7128, -74.0060)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter coordinates in the format: latitude, longitude
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isSaving || isUploadingImage}
                    disabled={isSaving || isUploadingImage}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving || isUploadingImage ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSaving || isUploadingImage}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Account Info */}
          <motion.div variants={staggerItem}>
            <Card>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Account Created:</span>
                  <span className="font-medium text-gray-800">
                    {new Date(currentUser?.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Friends:</span>
                  <span className="font-medium text-gray-800">
                    {currentUser?.friends?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-mono text-xs text-gray-500">{currentUser?._id}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
