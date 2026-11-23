import { getConfig } from './env.js';

export const createRateLimiters = () => {
  const config = getConfig();

  const baseOptions = {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiadas solicitudes, intenta más tarde' },
    statusCode: 429
  };

  const authLimiter = {
    ...baseOptions,
    windowMs: 60000,
    max: config.RATE_LIMIT_AUTH_MAX,
    message: { success: false, message: 'Demasiados intentos de autenticación, intenta en 1 minuto' }
  };

  const exportLimiter = {
    ...baseOptions,
    windowMs: config.RATE_LIMIT_EXPORT_WINDOW_MS,
    max: config.RATE_LIMIT_EXPORT_MAX,
    message: { success: false, message: 'Máximo 20 exportaciones por hora' }
  };

  return { baseOptions, authLimiter, exportLimiter };
};