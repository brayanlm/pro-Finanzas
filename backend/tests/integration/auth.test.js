import request from 'supertest';
import mongoose from 'mongoose';
import { safeCleanTestDatabase } from '../helpers/safeClean.js';
import app from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';
import User from '../../src/models/User.js';
import { generateAccessToken } from '../../src/utils/jwt.js';

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await safeCleanTestDatabase(mongoose, ['users']);
  });

  describe('POST /api/v1/auth/register', () => {
    test('registers new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Secure123!',
          confirmPassword: 'Secure123!',
          name: 'Test User'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.user.name).toBe('Test User');
      expect(res.body.data.token).toBeDefined();
    });

    test('rejects duplicate email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Secure123!',
          confirmPassword: 'Secure123!',
          name: 'Test User'
        })
        .expect(201);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Secure123!',
          confirmPassword: 'Secure123!',
          name: 'Test User 2'
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('CONFLICT');
    });

    test('rejects weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'weak@example.com',
          password: 'weak',
          confirmPassword: 'weak',
          name: 'Test User'
        })
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY');
    });

    test('rejects mismatched passwords', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'mismatch@example.com',
          password: 'Secure123!',
          confirmPassword: 'Different456!',
          name: 'Test User'
        })
        .expect(422);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'login@example.com',
          password: 'Secure123!',
          confirmPassword: 'Secure123!',
          name: 'Login User'
        });
    });

    test('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Secure123!'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(res.body.data.token).toBeDefined();
    });

    test('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword!'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    test('rejects non-existent user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Secure123!'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'me@example.com',
          password: 'Secure123!',
          confirmPassword: 'Secure123!',
          name: 'Me User'
        });
      token = registerRes.body.data.token;
    });

    test('returns user data with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('me@example.com');
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    test('rejects missing token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('rejects invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});