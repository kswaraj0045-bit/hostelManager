import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const setupSocket = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select('-password');
      if (!socket.user) return next(new Error('User not found'));
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join', (groupId) => {
      socket.join(`group:${groupId}`);
    });

    socket.on('leave', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    // Group chat socket events
    socket.on('join:group', (groupId) => {
      socket.join(`group:${groupId}`);
    });

    socket.on('chat:message', (data) => {
      if (data?.groupId) {
        io.to(`group:${data.groupId}`).emit('chat:message', data);
      }
    });

    socket.on('chat:typing', (data) => {
      if (data?.groupId) {
        socket.to(`group:${data.groupId}`).emit('chat:typing', {
          userId: socket.user?._id,
          name: socket.user?.name
        });
      }
    });

    socket.on('chat:stop-typing', (data) => {
      if (data?.groupId) {
        socket.to(`group:${data.groupId}`).emit('chat:stop-typing', {
          userId: socket.user?._id,
          name: socket.user?.name
        });
      }
    });
  });

  return {
    emitToGroup: (groupId, event, data) => {
      io.to(`group:${groupId}`).emit(event, data);
    }
  };
};
