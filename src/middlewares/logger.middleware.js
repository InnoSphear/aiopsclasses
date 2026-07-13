import morgan from 'morgan';
import logger from '../utils/logger.js';

const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

/**
 * Morgan request logging middleware.
 * Logs HTTP requests to Winston in all environments.
 */
const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream: morganStream }
);

export default requestLogger;
