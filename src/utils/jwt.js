import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Generate access and refresh tokens for a user.
 * @param {Object} user - User document.
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role?.name || user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expire }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpire }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify an access token.
 * @param {string} token - JWT access token.
 * @returns {Object} Decoded token payload.
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError}
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

/**
 * Verify a refresh token.
 * @param {string} token - JWT refresh token.
 * @returns {Object} Decoded token payload.
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError}
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};
