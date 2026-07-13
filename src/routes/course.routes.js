import { Router } from 'express';
import courseController from '../controllers/course.controller.js';
import authenticate from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/rbac.middleware.js';

const router = Router();

router.get('/published', courseController.getAllPublished);

router.use(authenticate);

router.get('/', authorize('courses:list'), courseController.getAll);
router.get('/stats', authorize('courses:list'), courseController.getStats);
router.get('/:id', authorize('courses:read'), courseController.getById);
router.post('/', authorize('courses:create'), courseController.create);
router.put('/:id', authorize('courses:update'), courseController.update);
router.delete('/:id', authorize('courses:delete'), courseController.delete);

export default router;
