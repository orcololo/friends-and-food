'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/contexts/ThemeContext';

export default function ThemeToggle() {
  const { effectiveTheme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
      aria-label={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-6 h-6">
        <motion.div
          initial={false}
          animate={{
            scale: effectiveTheme === 'light' ? 1 : 0,
            opacity: effectiveTheme === 'light' ? 1 : 0,
            rotate: effectiveTheme === 'light' ? 0 : 180,
          }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
          className="absolute inset-0"
        >
          <Sun className="w-6 h-6 text-yellow-500" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            scale: effectiveTheme === 'dark' ? 1 : 0,
            opacity: effectiveTheme === 'dark' ? 1 : 0,
            rotate: effectiveTheme === 'dark' ? 0 : -180,
          }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
          className="absolute inset-0"
        >
          <Moon className="w-6 h-6 text-blue-400" />
        </motion.div>
      </div>
    </motion.button>
  );
}
