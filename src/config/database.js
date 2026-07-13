import mongoose from 'mongoose';
import config from './index.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

/**
 * Connect to MongoDB with retry logic.
 * @param {number} retryCount - Current retry attempt number.
 * @returns {Promise<typeof mongoose>}
 */
export const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(config.database.uri);

    logger.info(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to database');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from database');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error(
      `MongoDB connection attempt ${retryCount + 1}/${MAX_RETRIES} failed: ${error.message}`
    );

    if (retryCount < MAX_RETRIES - 1) {
      logger.info(`Retrying connection in ${RETRY_DELAY_MS / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retryCount + 1);
    }

    logger.error('Max retries reached. Unable to connect to MongoDB.');
    throw error;
  }
};
