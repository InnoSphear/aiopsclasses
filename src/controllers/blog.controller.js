import blogService from '../services/blog.service.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const blogController = {
  create: asyncHandler(async (req, res) => {
    const blog = await blogService.createBlog({
      ...req.body,
      author: req.user._id,
    });
    return apiResponse.success(res, 'Blog created', blog, 201);
  }),

  update: asyncHandler(async (req, res) => {
    const blog = await blogService.updateBlog(req.params.id, req.body);
    return apiResponse.success(res, 'Blog updated', blog);
  }),

  delete: asyncHandler(async (req, res) => {
    await blogService.deleteBlog(req.params.id);
    return apiResponse.success(res, 'Blog deleted');
  }),

  getAllForAdmin: asyncHandler(async (req, res) => {
    const { page, limit, status, category, search } = req.query;
    const result = await blogService.getAllForAdmin({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      category,
      search,
    });
    return apiResponse.success(res, 'Blogs', result);
  }),

  getAllPublished: asyncHandler(async (req, res) => {
    const { page, limit, category, search, tag } = req.query;
    const result = await blogService.getAllPublished({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      category,
      search,
      tag,
    });
    return apiResponse.success(res, 'Blogs', result);
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const blog = await blogService.getBySlug(req.params.slug);
    return apiResponse.success(res, 'Blog', blog);
  }),

  incrementViews: asyncHandler(async (req, res) => {
    await blogService.incrementViews(req.params.slug);
    return apiResponse.success(res, 'View counted');
  }),
};

export default blogController;
