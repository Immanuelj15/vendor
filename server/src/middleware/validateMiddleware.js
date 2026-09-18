import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const formattedErrors = error.errors
      ? error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      : [error.message];
    next(new ApiError(400, 'Validation Error', ERROR_CODES.VALIDATION_ERROR, formattedErrors));
  }
};
