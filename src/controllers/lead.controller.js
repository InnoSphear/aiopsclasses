import leadService from '../services/lead.service.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const leadController = {
  create: asyncHandler(async (req, res) => {
    const lead = await leadService.create(req.body);
    return apiResponse.success(res, 'Message received. We will contact you soon.', lead, 201);
  }),

  getAll: asyncHandler(async (req, res) => {
    const { page, limit, status, search } = req.query;
    const result = await leadService.getAll({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      status,
      search,
    });
    return apiResponse.paginated(res, 'Leads retrieved', result.leads, result.pagination.page, result.pagination.limit, result.pagination.total);
  }),

  getById: asyncHandler(async (req, res) => {
    const lead = await leadService.getById(req.params.id);
    return apiResponse.success(res, 'Lead retrieved', lead);
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const lead = await leadService.updateStatus(req.params.id, req.body.status, req.user._id);
    return apiResponse.success(res, 'Lead updated', lead);
  }),

  addNote: asyncHandler(async (req, res) => {
    const lead = await leadService.addNote(req.params.id, req.body.notes);
    return apiResponse.success(res, 'Note added', lead);
  }),

  delete: asyncHandler(async (req, res) => {
    await leadService.delete(req.params.id);
    return apiResponse.success(res, 'Lead deleted');
  }),

  getStats: asyncHandler(async (req, res) => {
    const stats = await leadService.getStats();
    return apiResponse.success(res, 'Lead stats', { stats });
  }),
};

export default leadController;
