import { Router } from 'express';
import messageController from '../controllers/message.controller.js';
import authenticate from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/unread', messageController.getUnreadCounts);
router.get('/batch/:batchId', messageController.getByBatch);
router.post('/batch/:batchId', messageController.send);
router.patch('/batch/:batchId/read', messageController.markAsRead);
router.delete('/:id', messageController.delete);

export default router;
