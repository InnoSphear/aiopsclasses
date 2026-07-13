import { Router } from 'express';
import { userController } from '../controllers/index.js';
import authenticate from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/rbac.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validator.js';

const router = Router();

router.use(authenticate);

router.get('/stats/overview', authorize('users:list'), userController.getStats);
router.get('/', authorize('users:list'), userController.getAll);
router.get('/:id', authorize('users:read'), userController.getById);
router.post('/', authorize('users:create'), validate(createUserSchema), userController.create);
router.put('/:id', authorize('users:update'), validate(updateUserSchema), userController.update);
router.delete('/:id', authorize('users:delete'), userController.delete);

export default router;
