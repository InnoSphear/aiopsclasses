import { rateLimit } from 'express-rate-limit';
import config from '../config/index.js';

const SKIP_PATHS = ['/health', '/api/v1/auth/refresh'];

/**
 * General rate limiter: configurable via RATE_LIMIT_MAX_REQUESTS env var.
 * Defaults to 500 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs || 60 * 1000,
  max: config.rateLimit.maxRequests || 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => SKIP_PATHS.some((p) => req.path.startsWith(p)),
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_ERROR',
  },
});

/**
 * Auth rate limiter: 30 requests per 15 minutes per IP.
 * Use for login, register, and other auth routes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
    code: 'RATE_LIMIT_ERROR',
  },
});

/**
 * Strict rate limiter: 5 requests per hour per IP.
 * Use for password reset and other sensitive operations.
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts, please try again after 1 hour.',
    code: 'RATE_LIMIT_ERROR',
  },
});
