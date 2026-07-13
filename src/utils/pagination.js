/**
 * Parse pagination parameters from query string.
 * @param {Object} query - Request query object.
 * @returns {{ page: number, limit: number, sort: Object, skip: number }}
 */
export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  let sort = { createdAt: -1 };

  if (query.sort) {
    const sortField = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
    const sortOrder = query.sort.startsWith('-') ? -1 : 1;
    sort = { [sortField]: sortOrder };
  }

  return { page, limit, sort, skip };
};

/**
 * Build pagination metadata object.
 * @param {number} total - Total number of items.
 * @param {number} page - Current page number.
 * @param {number} limit - Items per page.
 * @returns {{ page: number, limit: number, total: number, pages: number, hasNext: boolean, hasPrev: boolean }}
 */
export const buildPaginationResponse = (total, page, limit) => {
  const pages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
};
