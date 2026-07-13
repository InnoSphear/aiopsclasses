import { ForbiddenError } from '../utils/apiError.js';

/**
 * Role-based access control middleware factory.
 * Checks if the authenticated user has the required permissions.
 * Superadmin (level 1) bypasses all permission checks.
 * @param {string|string[]} permissions - Required permission(s).
 * @returns {import('express').RequestHandler}
 */
const authorize = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const requiredPermissions = Array.isArray(permissions)
        ? permissions
        : [permissions];

      const userRole = req.user.role;

      if (!userRole) {
        throw new ForbiddenError('No role assigned');
      }

      if (userRole.level && userRole.level === 1) {
        return next();
      }

      const userPermissions = userRole.permissions || [];

      const hasPermission = requiredPermissions.some((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        throw new ForbiddenError(
          'You do not have permission to perform this action'
        );
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
      }
      next(error);
    }
  };
};

export default authorize;
