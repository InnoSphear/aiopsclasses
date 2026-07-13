import { ValidationError } from '../utils/apiError.js';

/**
 * Zod validation middleware factory.
 * Validates req.body against the provided Zod schema.
 * @param {import('zod').ZodObject} schema - Zod schema to validate against.
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        const error = new ValidationError('Validation failed', errors);
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
          errors: error.details,
        });
      }

      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;
