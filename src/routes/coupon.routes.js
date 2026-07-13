import { Router } from 'express';
import couponController from '../controllers/coupon.controller.js';
import authenticate from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/rbac.middleware.js';

const router = Router();

router.post('/validate', couponController.validate);

router.use(authenticate);
router.get('/', authorize('payments:coupons'), couponController.getAll);
router.get('/:id', authorize('payments:coupons'), couponController.getById);
router.post('/', authorize('payments:coupons'), couponController.create);
router.put('/:id', authorize('payments:coupons'), couponController.update);
router.delete('/:id', authorize('payments:coupons'), couponController.delete);

export default router;
