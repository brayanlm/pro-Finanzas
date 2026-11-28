import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // No reflejamos el valor recibido (`value`): puede contener datos sensibles.
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg
    }));
    throw AppError.unprocessable('Datos de entrada inválidos', details);
  }
  next();
};

// Sanitización anti NoSQL injection: elimina claves que empiezan por `$`
// y claves con `.`, recursivamente, sin mutar el original.
export const sanitizeMongo = (input) => {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeMongo(item));
  }
  if (input && typeof input === 'object') {
    if (input instanceof Date) return input;
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      if (key.startsWith('$') || key.includes('.')) continue; // bloquea $gt, $ne, $where, dotted keys
      sanitized[key] = sanitizeMongo(value);
    }
    return sanitized;
  }
  return input;
};

export const sanitizeQuery = (req, res, next) => {
  // `req.query` es getter de solo lectura en Express 5: NO lo reasignamos.
  req.sanitizedQuery = sanitizeMongo(req.query || {});
  // `req.body` sí es mutable: lo sanitizamos in place para proteger validators + controllers.
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeMongo(req.body);
    req.sanitizedBody = req.body;
  } else {
    req.sanitizedBody = req.body;
  }
  next();
};
