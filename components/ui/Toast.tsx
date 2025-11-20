'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (toast.duration! / 50));
          if (newProgress <= 0) {
            clearInterval(interval);
            // Schedule removal to avoid setState during render
            setTimeout(() => onRemove(toast.id), 0);
            return 0;
          }
          return newProgress;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [toast.duration, toast.id, onRemove]);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white';
      case 'info':
      default:
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    }
  };

  const getIcon = (type: ToastType) => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    switch (type) {
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'error':
        return <XCircle className={iconClass} />;
      case 'warning':
        return <AlertCircle className={iconClass} />;
      case 'info':
      default:
        return <Info className={iconClass} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`${getToastStyles(toast.type)} rounded-lg shadow-2xl min-w-[320px] max-w-[500px] pointer-events-auto overflow-hidden`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            {getIcon(toast.type)}
          </motion.div>
          <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-white/20">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-white/80"
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast, index) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ToastItem toast={toast} onRemove={removeToast} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
