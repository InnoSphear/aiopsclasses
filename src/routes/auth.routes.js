import { Router } from 'express';
import { authController } from '../controllers/index.js';
import { authenticate } from '../middlewares/index.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);

router.post('/login', authLimiter, validate(loginSchema), authController.login);

router.post('/logout', authenticate, authController.logout);

router.post('/refresh-token', authController.refreshToken);

router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

router.get('/me', authenticate, authController.getMe);

export default router;
