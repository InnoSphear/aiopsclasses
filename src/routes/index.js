import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import paymentRoutes from './payment.routes.js';
import courseRoutes from './course.routes.js';
import batchRoutes from './batch.routes.js';
import blogRoutes from './blog.routes.js';
import couponRoutes from './coupon.routes.js';
import sitemapRoutes from './sitemap.routes.js';
import uploadRoutes from './upload.routes.js';
import leadRoutes from './lead.routes.js';
import messageRoutes from './message.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/payments', paymentRoutes);
router.use('/courses', courseRoutes);
router.use('/batches', batchRoutes);
router.use('/blogs', blogRoutes);
router.use('/coupons', couponRoutes);
router.use('/upload', uploadRoutes);
router.use('/leads', leadRoutes);
router.use('/messages', messageRoutes);

const setupRoutes = (app) => {
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
  app.use('/api/v1', router);
  app.use('/', sitemapRoutes);
};

export default setupRoutes;
