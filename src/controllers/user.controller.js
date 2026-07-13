import userService from '../services/user.service.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const userController = {
  getAll: asyncHandler(async (req, res) => {
    const { page, limit, sort, search, role, isActive } = req.query;

    const sortObj = {};
    if (sort) {
      const field = sort.startsWith('-') ? sort.slice(1) : sort;
      const order = sort.startsWith('-') ? -1 : 1;
      sortObj[field] = order;
    }

    const result = await userService.getAll({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      sort: Object.keys(sortObj).length ? sortObj : { createdAt: -1 },
      search,
      role,
      isActive,
    });

    return apiResponse.paginated(
      res,
      'Users retrieved successfully',
      result.users,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10,
      result.total
    );
  }),

  getById: asyncHandler(async (req, res) => {
    const user = await userService.getById(req.params.id);

    return apiResponse.success(res, 'User retrieved successfully', { user });
  }),

  create: asyncHandler(async (req, res) => {
    const createdBy = req.user?._id;
    const user = await userService.create(req.body, createdBy);

    return apiResponse.success(res, 'User created successfully', { user }, 201);
  }),

  update: asyncHandler(async (req, res) => {
    const updatedBy = req.user?._id;
    const user = await userService.update(req.params.id, req.body, updatedBy);

    return apiResponse.success(res, 'User updated successfully', { user });
  }),

  delete: asyncHandler(async (req, res) => {
    const deletedBy = req.user?._id;
    await userService.delete(req.params.id, deletedBy);

    return apiResponse.success(res, 'User deleted successfully');
  }),

  getStats: asyncHandler(async (req, res) => {
    const stats = await userService.getStats();

    return apiResponse.success(res, 'User statistics retrieved', { stats });
  }),
};

export default userController;
