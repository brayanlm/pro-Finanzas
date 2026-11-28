import request from 'supertest';
import mongoose from 'mongoose';
import { safeCleanTestDatabase } from '../helpers/safeClean.js';
import app from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';
import User from '../../src/models/User.js';
import Category from '../../src/models/Category.js';

describe('Middleware Tests', () => {
  let user, admin, userToken, adminToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await safeCleanTestDatabase(mongoose, ['users']);

    const userReg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'user@test.com', password: 'Secure123!', confirmPassword: 'Secure123!', name: 'User' });
    user = userReg.body.data.user;
    userToken = userReg.body.data.token;

    const adminReg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'admin@test.com', password: 'Secure123!', confirmPassword: 'Secure123!', name: 'Admin' });
    admin = adminReg.body.data.user;
    adminToken = adminReg.body.data.token;

    await User.findByIdAndUpdate(admin.id, { role: 'ADMIN' });
  });

  describe('authMiddleware', () => {
    test('rejects requests without token', async () => {
      const res = await request(app)
        .get('/api/v1/categories')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    test('rejects invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', 'Bearer invalid')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('accepts valid token', async () => {
      const res = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('rbacMiddleware', () => {
    test('allows ADMIN to access admin routes', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('rejects USER from admin routes', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('ownerFilterMiddleware', () => {
    test('user1 cannot see user2 categories', async () => {
      const user2Reg = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'user2@test.com', password: 'Secure123!', confirmPassword: 'Secure123!', name: 'User 2' });
      const user2Token = user2Reg.body.data.token;

      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'User2 Category', type: 'expense', color: '#FF0000', icon: 'tag' })
        .expect(201);

      const res = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.every(c => c.name !== 'User2 Category')).toBe(true);
    });

    test('user1 cannot create movement with user2 category', async () => {
      const user2Reg = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'user3@test.com', password: 'Secure123!', confirmPassword: 'Secure123!', name: 'User 3' });
      const user2Token = user2Reg.body.data.token;

      const user2Category = await Category.findOne({ userId: user2Reg.body.data.user.id, type: 'expense' });
      const user1Account = await (await import('../../src/models/Account.js')).default.findOne({ userId: user.id });

      const res = await request(app)
        .post('/api/v1/movements')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'expense',
          description: 'Test',
          amount: 100,
          categoryId: user2Category._id.toString(),
          accountId: user1Account._id.toString(),
          date: '2024-01-15'
        })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('validationMiddleware', () => {
    test('rejects invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'invalid-email', password: 'Secure123!', confirmPassword: 'Secure123!', name: 'Test' })
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.details.some(d => d.field === 'email')).toBe(true);
    });

    test('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@test.com' })
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.details.length).toBeGreaterThan(0);
    });
  });
});