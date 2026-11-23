import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(e => ({
      field: e.path,
      message: e.msg,
      value: e.value
    }));
    throw AppError.unprocessable('Datos de entrada inválidos', details);
  }
  next();
};

export const sanitizeQuery = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      sanitized[key] = sanitize(value);
    }
    return sanitized;
  };

  req.query = sanitize(req.query);
  req.body = sanitize(req.body);
  next();
};