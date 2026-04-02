const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./env');

const configureSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: config.allowedOrigins,
      credentials: true,
    },
  });

  // Authentication middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} for user ${socket.userId}`);

    // Join user's personal room
    socket.join(`user_${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = configureSocket;