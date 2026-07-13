import { Router } from 'express';
import blogController from '../controllers/blog.controller.js';
import authenticate from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/rbac.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createBlogSchema, updateBlogSchema } from '../validators/blog.validator.js';

const router = Router();

// Public routes (no auth required)
router.get('/', blogController.getAllPublished);
router.get('/admin/all', authenticate, authorize('blogs:create'), blogController.getAllForAdmin);
router.get('/:slug', blogController.getBySlug);
router.patch('/:slug/views', blogController.incrementViews);

// Admin routes (permission-based RBAC)
router.post(
  '/',
  authenticate,
  authorize('blogs:create'),
  validate(createBlogSchema),
  blogController.create
);
router.put(
  '/:id',
  authenticate,
  authorize('blogs:update'),
  validate(updateBlogSchema),
  blogController.update
);
router.delete(
  '/:id',
  authenticate,
  authorize('blogs:delete'),
  blogController.delete
);

export default router;
