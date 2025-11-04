'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

export default function Home() {
  const features = [
    {
      icon: '🗺️',
      title: 'Discover Places',
      description: 'Explore restaurants on an interactive map and find hidden gems in your area',
    },
    {
      icon: '📅',
      title: 'Plan Events',
      description: 'Organize dining events with friends and coordinate meetups effortlessly',
    },
    {
      icon: '⭐',
      title: 'Share Reviews',
      description: 'Write reviews, rate places, and share your dining experiences with friends',
    },
    {
      icon: '👥',
      title: 'Create Groups',
      description: 'Build food communities and plan group dining adventures together',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 pt-20 pb-32"
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-6"
          >
            <span className="text-8xl mb-4 inline-block">🍴</span>
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-gray-800 mb-6"
          >
            Friends & Food
          </motion.h1>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-600 mb-10"
          >
            Discover restaurants, plan events, and share culinary experiences with your friends
          </motion.p>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/signup">
              <Button size="lg" className="min-w-[200px]">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                Sign In
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="container mx-auto px-4 pb-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-bold text-center text-gray-800 mb-16"
        >
          Everything you need to explore food together
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-shadow"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-orange-500 py-20"
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to start your culinary journey?</h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of food lovers discovering amazing places together
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="min-w-[250px]">
              Create Free Account
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
