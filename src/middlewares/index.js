import authenticate from './auth.middleware.js';
import authorize from './rbac.middleware.js';
import validate from './validate.middleware.js';
import errorHandler from './errorHandler.middleware.js';
import { generalLimiter, authLimiter, strictLimiter } from './rateLimit.middleware.js';
import requestLogger from './logger.middleware.js';
import notFoundHandler from './notFound.middleware.js';
import { uploadSingle, uploadMultiple, uploadFields, uploadImage } from './upload.middleware.js';

export {
  authenticate,
  authorize,
  validate,
  errorHandler,
  generalLimiter,
  authLimiter,
  strictLimiter,
  requestLogger,
  notFoundHandler,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadImage,
};
