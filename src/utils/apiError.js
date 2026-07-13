/**
 * Base application error class.
 */
export class AppError extends Error {
  /**
   * @param {string} message - Error message.
   * @param {number} statusCode - HTTP status code.
   * @param {string} [code] - Machine-readable error code.
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400).
 */
export class ValidationError extends AppError {
  /**
   * @param {string} message - Error message.
   * @param {Array<{field: string, message: string}>} [details] - Validation error details.
   */
  constructor(message = 'Validation failed', details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

/**
 * Authentication error (401).
 */
export class AuthenticationError extends AppError {
  /**
   * @param {string} [message] - Error message.
   */
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Forbidden error (403).
 */
export class ForbiddenError extends AppError {
  /**
   * @param {string} [message] - Error message.
   */
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN_ERROR');
  }
}

/**
 * Not found error (404).
 */
export class NotFoundError extends AppError {
  /**
   * @param {string} [resource] - Name of the resource not found.
   */
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

/**
 * Conflict error (409).
 */
export class ConflictError extends AppError {
  /**
   * @param {string} [message] - Error message.
   */
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * Rate limit error (429).
 */
export class RateLimitError extends AppError {
  /**
   * @param {string} [message] - Error message.
   */
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}
