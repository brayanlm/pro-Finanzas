export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'No autorizado', code = 'UNAUTHORIZED') {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'No tienes permisos para esta acción') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Recurso no encontrado') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message, details = null) {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static unprocessable(message, details = null) {
    return new AppError(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }

  static tooManyRequests(message = 'Demasiadas solicitudes') {
    return new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
  }

  static internal(message = 'Error interno del servidor') {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
}