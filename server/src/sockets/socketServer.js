import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import Group from '../models/Group.js';

let io = null;

export const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-group', async ({ groupId }) => {
      try {
        const group = await Group.findById(groupId);
        if (!group) return;

        const isMember = group.members.some(
          (m) => m.userId.toString() === socket.userId.toString()
        );

        if (isMember) {
          socket.join(`group:${groupId}`);
        }
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('leave-group', ({ groupId }) => {
      socket.leave(`group:${groupId}`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};
