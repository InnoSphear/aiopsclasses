import messageService from '../services/message.service.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const messageController = {
  send: asyncHandler(async (req, res) => {
    const { batchId } = req.params;
    const { content, type } = req.body;
    const message = await messageService.send(batchId, req.user._id, content, type, req.user);
    return apiResponse.success(res, 'Message sent', message, 201);
  }),

  getByBatch: asyncHandler(async (req, res) => {
    const { batchId } = req.params;
    const { page, limit } = req.query;
    const result = await messageService.getByBatch(batchId, req.user._id, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
    }, req.user);
    return apiResponse.success(res, 'Messages retrieved', result);
  }),

  markAsRead: asyncHandler(async (req, res) => {
    const { batchId } = req.params;
    await messageService.markAsRead(batchId, req.user._id);
    return apiResponse.success(res, 'Marked as read');
  }),

  getUnreadCounts: asyncHandler(async (req, res) => {
    const counts = await messageService.getUnreadCounts(req.user._id, req.user);
    return apiResponse.success(res, 'Unread counts', { counts });
  }),

  delete: asyncHandler(async (req, res) => {
    await messageService.delete(req.params.id, req.user._id, req.user);
    return apiResponse.success(res, 'Message deleted');
  }),
};

export default messageController;
