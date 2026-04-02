// Force IPv4 and set DNS servers (must be at the very top)
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const chalk = require('chalk');
const cookieParser = require('cookie-parser');

dotenv.config();

const { connectDB, getConnectionStatus } = require('./config/db');
const config = require('./config/env');
const { initSocket } = require('./socket');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { limiter, authLimiter } = require('./middleware/rateLimit');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Trust proxy - Required for rate limiting behind reverse proxy (Nginx/Cloudflare)
app.set('trust proxy', 1);

// Only show feature flags in development
if (process.env.NODE_ENV === 'development') {
  console.log(chalk.blue(`
📋 Feature Flags:
  • Redis: ${config.useRedis ? '✅ Enabled' : '❌ Disabled'}
  • Email: ${config.useEmail ? '✅ Enabled' : '❌ Disabled'}
  • Cloudinary: ${config.useCloudinary ? '✅ Enabled' : '❌ Disabled'}
`));
}

let initRedis, initCloudinary, initTransporter;

if (config.useRedis) {
  try {
    const redis = require('./config/redis');
    initRedis = redis.initRedis;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') console.log(chalk.yellow('⚠️ Redis module not available'));
    initRedis = async () => null;
  }
} else {
  initRedis = async () => null;
}

if (config.useCloudinary) {
  try {
    const cloudinary = require('./config/cloudinary');
    initCloudinary = cloudinary.initCloudinary;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') console.log(chalk.yellow('⚠️ Cloudinary module not available'));
    initCloudinary = () => null;
  }
} else {
  initCloudinary = () => null;
}

if (config.useEmail) {
  try {
    const email = require('./utils/emailService');
    initTransporter = email.initTransporter;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') console.log(chalk.yellow('⚠️ Email service module not available'));
    initTransporter = () => null;
  }
} else {
  initTransporter = () => null;
}

// CORS
const allowedOrigins = config.allowedOrigins;
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));

// Security & performance
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging - only log errors in production
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('tiny'));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
}

// Rate limiting – stricter in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api', limiter);
  app.use('/api/auth', authLimiter);
}

// Static files
app.use('/uploads', express.static(config.uploadPath));

// Health & root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Vibe Server Running',
    version: config.appVersion,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  const dbStatus = getConnectionStatus();
  res.status(dbStatus === 'connected' ? 200 : 503).json({
    success: dbStatus === 'connected',
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    uptime: process.uptime(),
    services: {
      database: { status: dbStatus },
      redis: { enabled: config.useRedis },
      email: { enabled: config.useEmail },
      cloudinary: { enabled: config.useCloudinary },
    },
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Vibe API is running.',
    version: config.appVersion,
  });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/hashtags', require('./routes/hashtags'));
app.use('/api/search', require('./routes/search'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/watch', require('./routes/watch'));
app.use('/api/groups', require('./routes/groups/index'));
app.use('/api/groups/members', require('./routes/groups/members'));
app.use('/api/groups/posts', require('./routes/groups/posts'));
app.use('/api/groups/events', require('./routes/groups/events'));
app.use('/api/groups/moderation', require('./routes/groups/moderation'));

// Admin routes
app.use('/api/admin/auth', require('./routes/admin/auth'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'));
app.use('/api/admin/settings', require('./routes/admin/settings'));
app.use('/api/admin/users', require('./routes/admin/users'));
app.use('/api/admin/groups', require('./routes/admin/groups'));
app.use('/api/admin/reports', require('./routes/admin/reports'));
app.use('/api/admin/analytics', require('./routes/admin/analytics'));
app.use('/api/admin/moderation', require('./routes/admin/moderation'));

// 404 and error handler
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;

const startServer = async () => {
  try {
    await connectDB();
    
    // Enhanced connection log
    const conn = mongoose.connection;
    const dbHost = conn.host;
    const dbName = conn.name;
    const isAtlas = dbHost.includes('mongodb.net');
    console.log(chalk.green(`✅ MongoDB Connected to ${isAtlas ? 'Atlas' : 'Local'} database: ${dbName}`));

    await initRedis();
    initCloudinary();
    initTransporter();
    initSocket(server);

    if (config.nodeEnv === 'production') {
      try {
        require('./jobs/cleanupJobs')();
        require('./jobs/emailJobs')();
      } catch (err) {
        // Silent fail for background jobs
      }
    }

    server.listen(PORT, () => {
      console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         🚀     VIBE SERVER     🚀                             ║
║  Port: ${PORT}  |  Environment: ${config.nodeEnv}  |  API: https://vibeserver.pxxl.click/api ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `));
    });
  } catch (error) {
    console.error(chalk.red('❌ Failed to start server:'), error.message);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  console.log(chalk.yellow('\n🛑 Shutting down...'));
  try {
    const { getIO } = require('./socket');
    const io = getIO();
    if (io) io.close();
  } catch (err) {}
  const { disconnectDB } = require('./config/db');
  await disconnectDB();
  server.close(() => {
    console.log(chalk.green('✅ Server closed gracefully'));
    process.exit(0);
  });
  setTimeout(() => {
    console.error(chalk.red('Forceful shutdown'));
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  gracefulShutdown();
});
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection:'), reason);
});

startServer();

module.exports = { app, server };