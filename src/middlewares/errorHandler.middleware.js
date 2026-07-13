import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import { AppError } from '../utils/apiError.js';

/**
 * Global error handling middleware.
 * Handles AppError, Mongoose errors, JWT errors, and generic errors.
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  if (err instanceof AppError) {
    const response = {
      success: false,
      message: err.message,
      code: err.code,
    };

    if (err.details) {
      response.errors = err.details;
    }

    return res.status(err.statusCode).json(response);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field '${field}': '${value}'. Please use another value.`,
      code: 'DUPLICATE_ERROR',
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired. Please log in again.',
      code: 'TOKEN_EXPIRED',
    });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      code: 'INVALID_ID',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = config.server.env === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message,
    code: 'INTERNAL_ERROR',
    ...(config.server.env !== 'production' && { stack: err.stack }),
  });
};

export default errorHandler;
