import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonCardProps {
  variant?: 'place' | 'event' | 'group' | 'post' | 'user';
  className?: string;
}

const skeletonPulse = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export default function SkeletonCard({ variant = 'place', className = '' }: SkeletonCardProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'place':
      case 'event':
      case 'group':
        return (
          <motion.div
            variants={skeletonPulse}
            initial="initial"
            animate="animate"
            className={`bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden ${className}`}
          >
            <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300" />
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
              <div className="h-10 bg-gray-200 rounded w-full" />
            </div>
          </motion.div>
        );

      case 'post':
        return (
          <motion.div
            variants={skeletonPulse}
            initial="initial"
            animate="animate"
            className={`bg-white rounded-xl shadow-md border border-gray-200 p-6 ${className}`}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-1/6" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
            <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-4" />
            <div className="flex items-center justify-between">
              <div className="h-8 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-20" />
            </div>
          </motion.div>
        );

      case 'user':
        return (
          <motion.div
            variants={skeletonPulse}
            initial="initial"
            animate="animate"
            className={`bg-white rounded-xl shadow-md border border-gray-200 p-4 ${className}`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return renderSkeleton();
}
