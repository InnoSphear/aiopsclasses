import couponService from '../services/coupon.service.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const couponController = {
  getAll: asyncHandler(async (req, res) => {
    const { page, limit, isActive } = req.query;
    const result = await couponService.getAll({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      isActive,
    });
    return apiResponse.paginated(res, 'Coupons retrieved', result.coupons, parseInt(page, 10) || 1, parseInt(limit, 10) || 20, result.total);
  }),

  getById: asyncHandler(async (req, res) => {
    const coupon = await couponService.getById(req.params.id);
    return apiResponse.success(res, 'Coupon retrieved', { coupon });
  }),

  create: asyncHandler(async (req, res) => {
    const coupon = await couponService.create(req.body, req.user?._id);
    return apiResponse.success(res, 'Coupon created', { coupon }, 201);
  }),

  update: asyncHandler(async (req, res) => {
    const coupon = await couponService.update(req.params.id, req.body, req.user?._id);
    return apiResponse.success(res, 'Coupon updated', { coupon });
  }),

  delete: asyncHandler(async (req, res) => {
    await couponService.delete(req.params.id, req.user?._id);
    return apiResponse.success(res, 'Coupon deleted');
  }),

  validate: asyncHandler(async (req, res) => {
    const { code, amount, courseId } = req.body;
    const result = await couponService.validate(code, amount, courseId);
    return apiResponse.success(res, 'Coupon validated', result);
  }),
};

export default couponController;
