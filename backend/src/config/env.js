import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().url().startsWith('mongodb'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_ISSUER: z.string().default('finanzas-app'),
  JWT_AUDIENCE: z.string().default('finanzas-app-users'),
  FRONTEND_URL: z.string().url(),
  EMAIL_HOST: z.string().min(1),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_USER: z.string().email(),
  EMAIL_PASSWORD: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(10),
  RATE_LIMIT_EXPORT_MAX: z.coerce.number().default(20),
  RATE_LIMIT_EXPORT_WINDOW_MS: z.coerce.number().default(3600000)
});

let config;

export const loadConfig = () => {
  if (config) return config;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }

  config = result.data;
  return config;
};

export const getConfig = () => {
  if (!config) {
    return loadConfig();
  }
  return config;
};

export default getConfig;