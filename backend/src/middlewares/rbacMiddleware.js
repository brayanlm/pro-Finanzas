import { AppError } from '../utils/AppError.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Autenticación requerida'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('No tienes permisos para esta acción'));
    }
    next();
  };
};

export const requireAdmin = authorize('ADMIN');
export const requireUser = authorize('USER', 'ADMIN');