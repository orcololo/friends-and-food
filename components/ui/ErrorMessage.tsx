import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export default function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        </motion.div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-1">
            {title}
          </h3>
          <p className="text-sm text-red-700 mb-4">
            {message}
          </p>

          {onRetry && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {retryLabel}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
