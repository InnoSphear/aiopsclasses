import courseService from '../services/course.service.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const courseController = {
  getAll: asyncHandler(async (req, res) => {
    const { page, limit, sort, search, category, isPublished, isActive } = req.query;
    const sortObj = {};
    if (sort) {
      const field = sort.startsWith('-') ? sort.slice(1) : sort;
      const order = sort.startsWith('-') ? -1 : 1;
      sortObj[field] = order;
    }
    const result = await courseService.getAll({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      sort: Object.keys(sortObj).length ? sortObj : { createdAt: -1 },
      search, category, isPublished, isActive,
    });
    return apiResponse.paginated(res, 'Courses retrieved successfully',
      result.courses, parseInt(page, 10) || 1, parseInt(limit, 10) || 10, result.total);
  }),

  getAllPublished: asyncHandler(async (req, res) => {
    const { page, limit, category } = req.query;
    const result = await courseService.getAllPublished({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      category,
    });
    return apiResponse.paginated(res, 'Published courses retrieved',
      result.courses, parseInt(page, 10) || 1, parseInt(limit, 10) || 10, result.total);
  }),

  getById: asyncHandler(async (req, res) => {
    const course = await courseService.getById(req.params.id);
    return apiResponse.success(res, 'Course retrieved successfully', { course });
  }),

  create: asyncHandler(async (req, res) => {
    const course = await courseService.create(req.body, req.user?._id);
    return apiResponse.success(res, 'Course created successfully', { course }, 201);
  }),

  update: asyncHandler(async (req, res) => {
    const course = await courseService.update(req.params.id, req.body, req.user?._id);
    return apiResponse.success(res, 'Course updated successfully', { course });
  }),

  delete: asyncHandler(async (req, res) => {
    await courseService.delete(req.params.id, req.user?._id);
    return apiResponse.success(res, 'Course deleted successfully');
  }),

  getStats: asyncHandler(async (req, res) => {
    const stats = await courseService.getStats();
    return apiResponse.success(res, 'Course statistics retrieved', { stats });
  }),
};

export default courseController;
