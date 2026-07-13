import { Router } from 'express';
import leadController from '../controllers/lead.controller.js';
import authenticate from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/rbac.middleware.js';

const router = Router();

router.post('/', leadController.create);

router.get('/', authenticate, authorize('leads:list'), leadController.getAll);
router.get('/stats', authenticate, authorize('leads:list'), leadController.getStats);
router.get('/:id', authenticate, authorize('leads:read'), leadController.getById);
router.patch('/:id/status', authenticate, authorize('leads:update'), leadController.updateStatus);
router.patch('/:id/notes', authenticate, authorize('leads:update'), leadController.addNote);
router.delete('/:id', authenticate, authorize('leads:delete'), leadController.delete);

export default router;
