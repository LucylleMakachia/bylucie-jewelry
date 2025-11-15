import morgan from 'morgan';
import logger from '../utils/logger.js';

// Define Morgan format string
const format = ':method :url :status :res[content-length] - :response-time ms';

// Create Morgan middleware that pipes through Winston
const morganMiddleware = morgan(format, {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});

export default morganMiddleware;
