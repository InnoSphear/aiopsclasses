import batchService from '../services/batch.service.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const batchController = {
  getAll: asyncHandler(async (req, res) => {
    const { page, limit, sort, search, course, status } = req.query;
    const sortObj = {};
    if (sort) {
      const field = sort.startsWith('-') ? sort.slice(1) : sort;
      const order = sort.startsWith('-') ? -1 : 1;
      sortObj[field] = order;
    }
    const result = await batchService.getAll({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      sort: Object.keys(sortObj).length ? sortObj : { createdAt: -1 },
      search, course, status,
    });
    return apiResponse.paginated(res, 'Batches retrieved successfully',
      result.batches, parseInt(page, 10) || 1, parseInt(limit, 10) || 10, result.total);
  }),

  getById: asyncHandler(async (req, res) => {
    const batch = await batchService.getById(req.params.id);
    return apiResponse.success(res, 'Batch retrieved successfully', { batch });
  }),

  create: asyncHandler(async (req, res) => {
    const batch = await batchService.create(req.body, req.user?._id);
    return apiResponse.success(res, 'Batch created successfully', { batch }, 201);
  }),

  update: asyncHandler(async (req, res) => {
    const batch = await batchService.update(req.params.id, req.body, req.user?._id);
    return apiResponse.success(res, 'Batch updated successfully', { batch });
  }),

  delete: asyncHandler(async (req, res) => {
    await batchService.delete(req.params.id, req.user?._id);
    return apiResponse.success(res, 'Batch deleted successfully');
  }),

  enrollStudent: asyncHandler(async (req, res) => {
    await batchService.enrollStudent(req.params.id, req.body.studentId);
    return apiResponse.success(res, 'Student enrolled successfully');
  }),

  removeStudent: asyncHandler(async (req, res) => {
    await batchService.removeStudent(req.params.id, req.params.studentId);
    return apiResponse.success(res, 'Student removed successfully');
  }),

  getStats: asyncHandler(async (req, res) => {
    const stats = await batchService.getStats();
    return apiResponse.success(res, 'Batch statistics retrieved', { stats });
  }),

  getEnrolledStudents: asyncHandler(async (req, res) => {
    const result = await batchService.getEnrolledStudents(req.params.id);
    return apiResponse.success(res, 'Enrolled students retrieved', result);
  }),

  getMyBatches: asyncHandler(async (req, res) => {
    const batches = await batchService.getMyBatches(req.user._id);
    return apiResponse.success(res, 'My batches retrieved', { batches });
  }),

  autoAssignBatch: asyncHandler(async (req, res) => {
    const { courseId, studentId } = req.body;
    const result = await batchService.autoAssignBatch(courseId, studentId);
    return apiResponse.success(res, 'Student assigned to batch', result);
  }),

  getCourseBatchesPublic: asyncHandler(async (req, res) => {
    const batches = await batchService.getCourseBatchesPublic(req.params.courseId);
    return apiResponse.success(res, 'Course batches retrieved', { batches });
  }),
};

export default batchController;
