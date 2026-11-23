import { getConfig } from './env.js';

export const corsOptions = () => {
  const config = getConfig();
  return {
    origin: config.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    maxAge: 86400
  };
};