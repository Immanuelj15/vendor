export class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errorCode = 'INTERNAL_SERVER_ERROR', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errorCode = errorCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
