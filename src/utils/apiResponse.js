/**
 * Standardized API response helper.
 */
const apiResponse = {
  /**
   * Send a success response.
   * @param {import('express').Response} res - Express response object.
   * @param {string} message - Response message.
   * @param {*} data - Response data.
   * @param {number} statusCode - HTTP status code.
   * @returns {import('express').Response}
   */
  success(res, message = 'Success', data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Send an error response.
   * @param {import('express').Response} res - Express response object.
   * @param {string} message - Error message.
   * @param {number} statusCode - HTTP status code.
   * @param {Array|Object|null} errors - Detailed error information.
   * @returns {import('express').Response}
   */
  error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors !== null) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  },

  /**
   * Send a paginated response.
   * @param {import('express').Response} res - Express response object.
   * @param {string} message - Response message.
   * @param {*} data - Response data array.
   * @param {number} page - Current page number.
   * @param {number} limit - Items per page.
   * @param {number} total - Total number of items.
   * @param {number} statusCode - HTTP status code.
   * @returns {import('express').Response}
   */
  paginated(res, message = 'Success', data = [], page = 1, limit = 10, total = 0, statusCode = 200) {
    const totalPages = Math.ceil(total / limit);

    return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  },
};

export default apiResponse;
