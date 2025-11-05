'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '@/lib/utils/socket-client';

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setShowStatus(true);
      // Hide status after 3 seconds
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setShowStatus(true);
    };

    const handleConnectError = () => {
      setIsConnected(false);
      setShowStatus(true);
    };

    // Check initial connection state
    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, []);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
            isConnected
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-white' : 'bg-white animate-pulse'
            }`}
          />
          <span className="text-sm font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {!isConnected && (
            <span className="text-xs opacity-80">Attempting to reconnect...</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
