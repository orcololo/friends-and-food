'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(token: string): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      auth: {
        token,
      },
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
