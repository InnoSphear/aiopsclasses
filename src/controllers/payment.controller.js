import paymentService from '../services/payment.service.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const paymentController = {
  createPayment: asyncHandler(async (req, res) => {
    const payment = await paymentService.createPayment({
      userId: req.user._id,
      amount: req.body.amount,
      paymentMethod: req.body.paymentMethod,
      transactionId: req.body.transactionId,
      screenshot: req.body.screenshot,
      paymentPlan: req.body.paymentPlan || req.user.paymentPlan || 'one_time',
    });
    return apiResponse.success(res, 'Payment submitted for verification', payment, 201);
  }),

  getMyPayment: asyncHandler(async (req, res) => {
    const payment = await paymentService.getMyPayment(req.user._id);
    return apiResponse.success(res, 'Payment details', payment);
  }),

  getAllPending: asyncHandler(async (req, res) => {
    const payments = await paymentService.getAllPending();
    return apiResponse.success(res, 'Pending payments', payments);
  }),

  approvePayment: asyncHandler(async (req, res) => {
    const payment = await paymentService.approvePayment(req.params.id, req.user._id);
    return apiResponse.success(res, 'Payment approved', payment);
  }),

  rejectPayment: asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const payment = await paymentService.rejectPayment(req.params.id, req.user._id, reason);
    return apiResponse.success(res, 'Payment rejected', payment);
  }),

  getPaymentStats: asyncHandler(async (req, res) => {
    const stats = await paymentService.getPaymentStats();
    return apiResponse.success(res, 'Payment stats', stats);
  }),

  getMyPaymentStatus: asyncHandler(async (req, res) => {
    const status = await paymentService.getMyPaymentStatus(req.user._id);
    return apiResponse.success(res, 'Payment status', status);
  }),

  getAllPayments: asyncHandler(async (req, res) => {
    const { page, limit, status, batch, search } = req.query;
    const result = await paymentService.getAllPayments({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      status,
      batch,
      search,
    });
    return apiResponse.paginated(res, 'All payments', result.payments, result.pagination.page, result.pagination.limit, result.pagination.total);
  }),
};

export default paymentController;
