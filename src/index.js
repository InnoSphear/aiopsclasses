import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from './middlewares/mongoSanitize.middleware.js';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

import config from './config/index.js';
import { connectDB } from './config/database.js';
import logger from './utils/logger.js';
import errorHandler from './middlewares/errorHandler.middleware.js';
import notFoundHandler from './middlewares/notFound.middleware.js';
import requestLogger from './middlewares/logger.middleware.js';
import { generalLimiter } from './middlewares/rateLimit.middleware.js';
import setupRoutes from './routes/index.js';

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

const allowedOrigins = config.server.clientUrls;

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
}));
app.use(mongoSanitize());
app.use(compression());
app.use(cookieParser());
app.use(generalLimiter);
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: config.server.env,
    },
  });
});

setupRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    logger.info(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    logger.info(`Socket ${socket.id} left room ${roomId}`);
  });

  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(config.server.port, () => {
      logger.info(
        `Server running in ${config.server.env} mode on port ${config.server.port}`
      );
      logger.info(`API version: ${config.server.apiVersion}`);
      logger.info(`Client URL: ${config.server.clientUrl}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  httpServer.close(() => process.exit(1));
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  httpServer.close(() => process.exit(1));
});

startServer();

export { app, httpServer as server };
