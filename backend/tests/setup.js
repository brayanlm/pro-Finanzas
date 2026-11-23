import { jest } from '@jest/globals';

jest.setTimeout(10000);

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/finanzas_test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-32chars';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_ISSUER = 'finanzas-app';
  process.env.JWT_AUDIENCE = 'finanzas-app-users';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  process.env.EMAIL_HOST = 'smtp.test.com';
  process.env.EMAIL_PORT = '587';
  process.env.EMAIL_USER = 'test@test.com';
  process.env.EMAIL_PASSWORD = 'test';
  process.env.EMAIL_FROM = 'Test <test@test.com>';
});

afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});