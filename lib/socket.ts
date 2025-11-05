import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from './utils/auth';

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Authentication error'));
    }

    socket.data.userId = decoded.userId;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });

    // Join event room
    socket.on('join-event', (eventId: string) => {
      socket.join(`event:${eventId}`);
    });

    // Leave event room
    socket.on('leave-event', (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });

    // Join group room
    socket.on('join-group', (groupId: string) => {
      socket.join(`group:${groupId}`);
    });

    // Leave group room
    socket.on('leave-group', (groupId: string) => {
      socket.leave(`group:${groupId}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Helper functions to emit events
export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToEvent(eventId: string, event: string, data: any) {
  if (io) {
    io.to(`event:${eventId}`).emit(event, data);
  }
}

export function emitToGroup(groupId: string, event: string, data: any) {
  if (io) {
    io.to(`group:${groupId}`).emit(event, data);
  }
}
