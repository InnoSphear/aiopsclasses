import winston from 'winston';
import config from '../config/index.js';
import { mkdirSync } from 'fs';

const logsDir = 'logs';
try {
  mkdirSync(logsDir, { recursive: true });
} catch {
  // Directory already exists
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'classplatform-backend' },
  transports: [
    new winston.transports.File({
      filename: `${logsDir}/error.log`,
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: `${logsDir}/combined.log`,
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (config.server.env !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, service, stack }) => {
          const msg = stack || message;
          return `[${timestamp}] ${level}: ${msg}`;
        })
      ),
    })
  );
}

export default logger;
