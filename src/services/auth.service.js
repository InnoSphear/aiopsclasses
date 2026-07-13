import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { userRepository, roleRepository } from '../repositories/index.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from '../utils/apiError.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import Coupon from '../models/Coupon.model.js';
import Course from '../models/Course.model.js';
import batchService from './batch.service.js';

const parseExpiry = (expiry) => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const [, value, unit] = match;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return parseInt(value, 10) * multipliers[unit];
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const generateVerificationToken = (userId) => {
  const token = jwt.sign(
    { userId, purpose: 'email-verification' },
    config.jwt.secret,
    { expiresIn: '10m' }
  );
  return token;
};

const authService = {
  async register(data) {
    const { name, email, phone, password, selectedCourse, selectedCourseName, paymentPlan, couponCode, discountAmount } = data;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    const studentRole = await roleRepository.findByName('student');
    if (!studentRole) {
      throw new NotFoundError('Student role');
    }

    let courseDoc = null;
    let monthlyFee = 0;
    let assignedBatch = null;

    if (selectedCourse) {
      courseDoc = await Course.findById(selectedCourse);
      if (courseDoc) {
        monthlyFee = courseDoc.fee || 0;
      }
    }

    if (selectedCourseName && !courseDoc) {
      courseDoc = await Course.findOne({ name: { $regex: new RegExp(`^${selectedCourseName}$`, 'i') } });
      if (courseDoc) {
        monthlyFee = courseDoc.fee || 0;
      }
    }

    let validatedCoupon = null;
    if (couponCode) {
      try {
        const couponDoc = await Coupon.findOne({
          code: couponCode.toUpperCase().trim(),
          isActive: true,
        });

        if (couponDoc) {
          if (couponDoc.expiryDate && new Date() > couponDoc.expiryDate) {
            logger.info(`Coupon expired: ${couponCode}`);
          } else if (couponDoc.maxUses > 0 && couponDoc.usedCount >= couponDoc.maxUses) {
            logger.info(`Coupon usage limit reached: ${couponCode}`);
          } else if (!couponDoc.allCourses && couponDoc.applicableCourses?.length > 0 && courseDoc) {
            const isApplicable = couponDoc.applicableCourses.some(
              (c) => c.toString() === courseDoc._id.toString()
            );
            if (!isApplicable) {
              logger.info(`Coupon ${couponCode} not applicable for course ${courseDoc.name}`);
            } else {
              validatedCoupon = couponDoc;
            }
          } else {
            validatedCoupon = couponDoc;
          }
        }
      } catch (err) {
        logger.error('Coupon validation error:', err);
      }
    }

    const user = await userRepository.create({
      name,
      email,
      phone: phone || undefined,
      password,
      role: studentRole._id,
      isActive: true,
      isEmailVerified: false,
      accountStatus: 'pending_payment',
      paymentStatus: 'pending',
      selectedCourse: courseDoc?._id || selectedCourse || undefined,
      selectedCourseName: courseDoc?.name || selectedCourseName || '',
      paymentPlan: paymentPlan || 'monthly',
    });

    if (courseDoc) {
      try {
        assignedBatch = await batchService.autoAssignBatch(courseDoc._id, user._id);
        logger.info(`Auto-assigned ${email} to batch: ${assignedBatch.batchName}`);
      } catch (err) {
        logger.error('Auto-assign batch error:', err);
      }
    }

    if (validatedCoupon) {
      await Coupon.findByIdAndUpdate(validatedCoupon._id, { $inc: { usedCount: 1 } });
      logger.info(`Coupon ${couponCode} used by ${email}`);
    }

    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await userRepository.update(user._id, {
      emailVerification: {
        otp: hashedOtp,
        expiresAt: otpExpiry,
      },
    });

    const verificationToken = generateVerificationToken(user._id);

    logger.info(`Email verification OTP for ${email}: ${otp}`);

    const populatedUser = await userRepository.findById(user._id, {
      path: 'role',
      select: 'name displayName level',
    });

    return {
      user: populatedUser,
      verificationToken,
      otp,
      monthlyFee,
      courseName: courseDoc?.name || selectedCourseName || '',
      batchInfo: assignedBatch || null,
      couponApplied: validatedCoupon ? {
        code: validatedCoupon.code,
        discountType: validatedCoupon.discountType,
        discountValue: validatedCoupon.discountValue,
      } : null,
    };
  },

  async login(email, password, ipAddress, userAgent) {
    const user = await userRepository.findByEmail(email, '+password');
    if (!user) {
      logger.warn(`Login attempt for non-existent email: ${email}`);
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Invalid password attempt for email: ${email}`);
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Your account has been deactivated. Please contact support.');
    }

    if (user.accountStatus === 'pending_payment') {
      throw new AuthenticationError('Payment not completed. Please complete the payment to access the platform. For any queries, call: 6203818011');
    }

    if (user.accountStatus === 'pending_verification') {
      throw new AuthenticationError('Your account is under verification. Payment verification takes up to 1 working day. For any queries, call: 6203818011');
    }

    if (user.accountStatus === 'rejected') {
      throw new AuthenticationError(`Your account has been rejected. ${user.rejectionReason || 'Please contact support.'} Call: 6203818011 for details.`);
    }

    if (user.accountStatus !== 'active') {
      throw new AuthenticationError('Your account is not active. Please contact support at 6203818011 for details.');
    }

    const smtpConfigured = config.email.user && config.email.pass;
    if (!user.isEmailVerified && config.server.env !== 'development' && smtpConfigured) {
      throw new AuthenticationError('Please verify your email before logging in.');
    }

    const tokens = generateTokens(user);
    const refreshExpiry = parseExpiry(config.jwt.refreshExpire);

    const userDoc = await userRepository.model.findById(user._id);
    userDoc.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + refreshExpiry),
      userAgent: userAgent || '',
      ipAddress: ipAddress || '',
    });

    // Keep max 5 refresh tokens per user
    if (userDoc.refreshTokens.length > 5) {
      userDoc.refreshTokens = userDoc.refreshTokens.slice(-5);
    }

    userDoc.lastLogin = new Date();
    userDoc.loginCount = (userDoc.loginCount || 0) + 1;
    await userDoc.save();

    const populatedUser = await userRepository.findById(user._id, {
      path: 'role',
      select: 'name displayName level permissions',
    });

    return {
      user: populatedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  async logout(userId, refreshToken) {
    const user = await userRepository.model.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(
        (t) => t.token !== refreshToken
      );
    } else {
      user.refreshTokens = [];
    }

    await user.save();
    return true;
  },

  async refreshToken(token, ipAddress, userAgent) {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const user = await userRepository.model.findById(decoded.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account has been deactivated');
    }

    const tokenExists = user.refreshTokens.some((t) => t.token === token);
    if (!tokenExists) {
      // Token reuse detected - clear all refresh tokens
      user.refreshTokens = [];
      await user.save();
      throw new AuthenticationError('Refresh token reuse detected. Please log in again.');
    }

    // Remove old refresh token
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== token);

    // Generate new tokens
    const tokens = generateTokens(user);

    const refreshExpiry = parseExpiry(config.jwt.refreshExpire);
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + refreshExpiry),
      userAgent: userAgent || '',
      ipAddress: ipAddress || '',
    });

    // Keep max 5 refresh tokens
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save();

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal whether email exists
      return { message: 'If an account exists with this email, a reset code has been sent.' };
    }

    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const userDoc = await userRepository.model.findById(user._id);
    userDoc.passwordReset = {
      token: `${hashedToken}:${hashedOtp}`,
      expiresAt,
    };
    await userDoc.save();

    logger.info(`Password reset OTP for ${email}: ${otp}, token: ${token}`);

    return {
      message: 'If an account exists with this email, a reset code has been sent.',
      resetToken: token,
      otp,
    };
  },

  async resetPassword(token, password) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const userDoc = await userRepository.model.findOne({
      'passwordReset.expiresAt': { $gt: new Date() },
    }).select('+passwordReset.token');

    if (!userDoc || !userDoc.passwordReset || !userDoc.passwordReset.token) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const storedHash = userDoc.passwordReset.token.split(':')[0];
    if (storedHash !== hashedToken) {
      throw new ValidationError('Invalid or expired reset token');
    }

    userDoc.password = password;
    userDoc.passwordReset = { token: undefined, expiresAt: undefined };
    userDoc.refreshTokens = [];
    await userDoc.save();

    return { message: 'Password has been reset successfully' };
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.model.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User');
    }

    const isCurrentValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();

    return { message: 'Password changed successfully' };
  },

  async verifyEmail(userId, otp) {
    const user = await userRepository.model.findById(userId).select('+emailVerification.otp +emailVerification.expiresAt');
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    if (!user.emailVerification || !user.emailVerification.otp) {
      throw new ValidationError('No verification pending. Please request a new code.');
    }

    if (new Date() > user.emailVerification.expiresAt) {
      throw new ValidationError('Verification code has expired. Please request a new one.');
    }

    const hashedOtp = hashOTP(otp);
    if (hashedOtp !== user.emailVerification.otp) {
      throw new ValidationError('Invalid verification code');
    }

    user.isEmailVerified = true;
    user.emailVerification = { otp: undefined, expiresAt: undefined };
    await user.save();

    return { message: 'Email verified successfully' };
  },

  async getMe(userId) {
    const user = await userRepository.findById(userId, {
      path: 'role',
      select: 'name displayName level permissions',
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  },
};

export default authService;
