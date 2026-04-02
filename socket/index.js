const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

let io = null;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: config.allowedOrigins,
      credentials: true,
    },
    // Disable logging
    logger: false,
    serveClient: false,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`Socket connected: ${socket.id} for user ${socket.userId}`);
    }
    
    socket.join(`user_${socket.userId}`);

    socket.on('send_message', (data) => {
      io.to(`user_${data.receiverId}`).emit('new_message', { ...data, senderId: socket.userId });
    });

    socket.on('typing', ({ receiverId, isTyping }) => {
      socket.to(`user_${receiverId}`).emit('user_typing', { userId: socket.userId, isTyping });
    });

    socket.on('reaction_update', ({ postId, reaction, type }) => {
      socket.broadcast.emit('reaction_updated', { postId, reaction, type });
    });

    socket.on('disconnect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Socket disconnected: ${socket.id}`);
      }
    });
  });

  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };