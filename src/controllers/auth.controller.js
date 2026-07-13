import jwt from 'jsonwebtoken';
import authService from '../services/auth.service.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import config from '../config/index.js';

const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);

    return apiResponse.success(res, 'Registration successful. Please verify your email.', {
      user: result.user,
      verificationToken: result.verificationToken,
    }, 201);
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await authService.login(email, password, ipAddress, userAgent);

    const cookieOptions = {
      httpOnly: true,
      secure: config.server.env === 'production',
      sameSite: config.server.env === 'production' ? 'none' : 'lax',
      path: '/',
    };

    if (config.server.env === 'development') {
      res.cookie('refreshToken', result.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return apiResponse.success(res, 'Login successful', {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }),

  logout: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    await authService.logout(userId, refreshToken);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.server.env === 'production',
      sameSite: config.server.env === 'production' ? 'none' : 'lax',
      path: '/',
    });

    return apiResponse.success(res, 'Logged out successfully');
  }),

  refreshToken: asyncHandler(async (req, res) => {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      return apiResponse.error(res, 'Refresh token is required', 400);
    }

    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await authService.refreshToken(token, ipAddress, userAgent);

    const cookieOptions = {
      httpOnly: true,
      secure: config.server.env === 'production',
      sameSite: config.server.env === 'production' ? 'none' : 'lax',
      path: '/',
    };

    if (config.server.env === 'development') {
      res.cookie('refreshToken', result.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return apiResponse.success(res, 'Token refreshed successfully', {
      accessToken: result.accessToken,
      refreshToken: config.server.env === 'development' ? undefined : result.refreshToken,
    });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);

    return apiResponse.success(res, result.message, {
      resetToken: result.resetToken,
      otp: result.otp,
    });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);

    return apiResponse.success(res, result.message);
  }),

  changePassword: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(userId, currentPassword, newPassword);

    return apiResponse.success(res, result.message);
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    const { otp, token } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch {
      return apiResponse.error(res, 'Invalid or expired verification token', 400);
    }

    const result = await authService.verifyEmail(decoded.userId, otp);

    return apiResponse.success(res, result.message);
  }),

  getMe: asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user._id);

    return apiResponse.success(res, 'User profile retrieved', { user });
  }),
};

export default authController;
