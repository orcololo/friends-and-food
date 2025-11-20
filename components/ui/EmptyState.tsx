import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`text-center py-12 px-4 ${className}`}
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <Icon className="w-20 h-20 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
      </motion.div>

      <h3 className="text-2xl font-semibold text-gray-800 mb-2">
        {title}
      </h3>

      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {actionLabel && onAction && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={onAction}>
                {actionLabel}
              </Button>
            </motion.div>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={onSecondaryAction} variant="outline">
                {secondaryActionLabel}
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
