import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.model.js';
import { AppError, AuthenticationError } from '../utils/apiError.js';

/**
 * JWT authentication middleware.
 * Extracts and verifies JWT token from Authorization header or cookies.
 * Attaches authenticated user to req.user.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token && req.cookies) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AuthenticationError('Access denied. No token provided.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token has expired. Please log in again.');
      }
      throw new AuthenticationError('Invalid token.');
    }

    const user = await User.findById(decoded.userId).populate('role');

    if (!user) {
      throw new AuthenticationError('User no longer exists.');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account has been deactivated.');
    }

    if (user.isDeleted) {
      throw new AuthenticationError('Account has been deleted.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    next(error);
  }
};

export default authenticate;
