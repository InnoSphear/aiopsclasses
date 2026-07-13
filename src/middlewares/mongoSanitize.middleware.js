/**
 * Custom MongoDB sanitizer middleware factory (Express 5 compatible).
 * Replaces express-mongo-sanitize which is incompatible with Express 5's getter-only req.query.
 * Strips keys starting with $ and . from req.body, req.params to prevent NoSQL injection.
 */

const sanitizeKey = (key) => key.startsWith('$') || key.startsWith('.');

const deepSanitize = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepSanitize);

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sanitizeKey(key)) continue;
    sanitized[key] = deepSanitize(value);
  }
  return sanitized;
};

const mongoSanitize = () => {
  return (req, _res, next) => {
    if (req.body && typeof req.body === 'object') {
      req.body = deepSanitize(req.body);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = deepSanitize(req.params);
    }
    next();
  };
};

export default mongoSanitize;
