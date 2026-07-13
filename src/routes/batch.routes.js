import { Router } from 'express';
import batchController from '../controllers/batch.controller.js';
import authenticate from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/rbac.middleware.js';

const router = Router();

router.get('/course/:courseId', batchController.getCourseBatchesPublic);

router.use(authenticate);

router.get('/my', batchController.getMyBatches);
router.post('/auto-assign', batchController.autoAssignBatch);
router.get('/', authorize('batches:list'), batchController.getAll);
router.get('/stats', authorize('batches:list'), batchController.getStats);
router.get('/:id', authorize('batches:read'), batchController.getById);
router.get('/:id/students', authorize('batches:read'), batchController.getEnrolledStudents);
router.post('/', authorize('batches:create'), batchController.create);
router.put('/:id', authorize('batches:update'), batchController.update);
router.delete('/:id', authorize('batches:delete'), batchController.delete);
router.post('/:id/enroll', authorize('batches:enroll'), batchController.enrollStudent);
router.delete('/:id/students/:studentId', authorize('batches:enroll'), batchController.removeStudent);

export default router;
