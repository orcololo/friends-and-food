'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
        transition={{ duration: 0.2 }}
        className={`bg-white rounded-lg shadow-md p-4 ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>{children}</div>;
}
