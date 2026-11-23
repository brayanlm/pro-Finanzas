import { AppError } from '../utils/AppError.js';
import { getConfig } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  const config = getConfig();
  const isDev = config.NODE_ENV === 'development';

  let error = { ...err };
  error.message = err.message;

  if (err.name === 'CastError') {
    error = new AppError('ID inválido', 400, 'INVALID_ID');
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field} ya existe`, 409, 'DUPLICATE_FIELD', { field });
  }

  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    error = new AppError('Datos de entrada inválidos', 422, 'VALIDATION_ERROR', details);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token inválido', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expirado', 401, 'TOKEN_EXPIRED');
  }

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.isOperational ? error.message : 'Error interno del servidor';
  const details = error.details || null;

  if (!error.isOperational) {
    console.error('ERROR:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      user: req.user?.id
    });
  }

  const response = {
    success: false,
    message,
    ...(details && { details }),
    ...(isDev && !error.isOperational && { stack: err.stack })
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
};