import { Router } from 'express';
import paymentController from '../controllers/payment.controller.js';
import authenticate from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/rbac.middleware.js';

const router = Router();

// User routes
router.post('/', authenticate, paymentController.createPayment);
router.get('/my', authenticate, paymentController.getMyPayment);
router.get('/my/status', authenticate, paymentController.getMyPaymentStatus);

// Admin routes
router.get('/all', authenticate, authorize('payments:list'), paymentController.getAllPayments);
router.get('/pending', authenticate, authorize('payments:list'), paymentController.getAllPending);
router.patch('/:id/approve', authenticate, authorize('payments:approve'), paymentController.approvePayment);
router.patch('/:id/reject', authenticate, authorize('payments:reject'), paymentController.rejectPayment);
router.get('/stats', authenticate, authorize('payments:list'), paymentController.getPaymentStats);

export default router;
