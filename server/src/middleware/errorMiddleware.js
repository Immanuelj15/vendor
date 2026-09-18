import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, ERROR_CODES.INTERNAL_SERVER_ERROR, [error.message]);
  }

  const response = {
    success: false,
    message: error.message,
    errorCode: error.errorCode,
    errors: error.errors,
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};
