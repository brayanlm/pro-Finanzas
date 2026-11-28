import { AppError } from '../utils/AppError.js';
import { getConfig } from '../config/env.js';

// Sanitiza texto para NO exponer credenciales/secretos en logs internos.
const sanitize = (value) => {
  if (value === undefined || value === null) return value;
  let s = String(value);
  // URIs de Mongo con credenciales embebidas.
  s = s.replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, 'mongodb://[REDACTED]');
  s = s.replace(/(:\/\/)([^/\s:@]+):([^/\s@]+)@/gi, '$1[REDACTED]@');
  s = s.replace(/(password|passwd|secret|token|apikey|api_key|authorization)["'=:\s]+[^\s,;"']+/gi, '$1=[REDACTED]');
  return s.slice(0, 500);
};

const isDatabaseError = (err) =>
  err?.name === 'MongoServerError' ||
  err?.name === 'MongoError' ||
  err?.name === 'MongooseServerSelectionError' ||
  err?.name === 'MongoBulkWriteError' ||
  err?.name === 'MongoExpiredSessionError' ||
  err?.name === 'MongoTransactionError';

// Logging interno SEGURO (no se devuelve al cliente; sin secretos ni `keyValue`).
const logDatabaseErrorSafely = (err, req) => {
  console.error('DATABASE_ERROR:', {
    name: err?.name,
    code: err?.code,
    codeName: err?.codeName,
    errorLabels: Array.isArray(err?.errorLabels) ? err.errorLabels : undefined,
    message: sanitize(err?.message),
    path: req?.path,
    method: req?.method
  });
};

// Normaliza errores de Mongoose / JWT a AppError conservando código HTTP y `code`.
const normalizeError = (err) => {
  if (err instanceof AppError) return err;

  if (err?.name === 'CastError') {
    return new AppError('ID inválido', 400, 'INVALID_ID');
  }

  if (err?.code === 11000) {
    const keyValue = err.keyValue || {};
    const field = Object.keys(keyValue)[0] || 'campo';
    return new AppError(`${field} ya existe`, 409, 'DUPLICATE_FIELD', { field });
  }

  if (err?.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message
    }));
    return new AppError('Datos de entrada inválidos', 422, 'VALIDATION_ERROR', details);
  }

  if (
    err?.name === 'MongoServerError' ||
    err?.name === 'MongoError' ||
    err?.name === 'MongooseServerSelectionError' ||
    err?.name === 'MongoBulkWriteError'
  ) {
    // No filtramos detalles internos de la base de datos al cliente.
    return new AppError('Error de base de datos', 503, 'DATABASE_ERROR');
  }

  if (err?.name === 'JsonWebTokenError') {
    return new AppError('Token inválido', 401, 'INVALID_TOKEN');
  }

  if (err?.name === 'TokenExpiredError') {
    return new AppError('Token expirado', 401, 'TOKEN_EXPIRED');
  }

  if (err?.name === 'SyntaxError' && err?.status === 400) {
    return new AppError('JSON inválido', 400, 'INVALID_JSON');
  }

  return err;
};

export const errorHandler = (err, req, res, _next) => {
  const config = getConfig();
  const isDev = config.NODE_ENV === 'development';

  const error = normalizeError(err);
  const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
  const code = error?.code || 'INTERNAL_ERROR';
  const isOperational = Boolean(error?.isOperational);
  const message = isOperational && error?.message ? error.message : 'Error interno del servidor';
  const details = error?.details || null;

  if (isDatabaseError(err)) {
    // Logging interno seguro del error de base de datos real (no se expone al cliente).
    logDatabaseErrorSafely(err, req);
  }

  if (!isOperational) {
    // Logs internos sin credenciales; nunca se devuelven secretos al cliente.
    console.error('ERROR:', {
      message: sanitize(err?.message),
      name: err?.name,
      stack: err?.stack ? sanitize(err.stack) : undefined,
      path: req?.path,
      method: req?.method,
      user: req?.user?.id
    });
  }

  const response = {
    success: false,
    code,
    message,
    ...(details && { details }),
    ...(isDev && !isOperational && err?.stack ? { stack: err.stack } : {})
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
};
