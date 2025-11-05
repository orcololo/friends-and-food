'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
  background?: 'white' | 'gray' | 'gradient';
  border?: boolean;
}

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  shadow = 'md',
  background = 'white',
  border = true,
}: CardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  };

  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-white to-gray-50',
  };

  const borderClass = border ? 'border border-gray-200' : '';

  const baseClasses = `rounded-lg transition-all duration-300 ${paddingClasses[padding]} ${shadowClasses[shadow]} ${backgroundClasses[background]} ${borderClass} ${className}`;

  if (hover) {
    return (
      <motion.div
        whileHover={{
          y: -8,
          scale: 1.02,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        className={`${baseClasses} hover:shadow-xl`}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={baseClasses}>{children}</div>;
}
