import request from 'supertest';
import mongoose from 'mongoose';
import { safeCleanTestDatabase } from '../helpers/safeClean.js';
import app from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';
import User from '../../src/models/User.js';
import Category from '../../src/models/Category.js';
import Account from '../../src/models/Account.js';
import Movement from '../../src/models/Movement.js';
import Budget from '../../src/models/Budget.js';

describe('Movement Integration Tests', () => {
  let user1, user2, token1, token2;
  let incomeCategory, expenseCategory, account;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await safeCleanTestDatabase(mongoose);

    const register1 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'user1@test.com', password: 'Secure123!', confirmPassword: 'Secure123!', name: 'User 1' });
    user1 = register1.body.data.user;
    token1 = register1.body.data.token;

    const register2 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'user2@test.com', password: 'Secure123!', confirmPassword: 'Secure123!', name: 'User 2' });
    user2 = register2.body.data.user;
    token2 = register2.body.data.token;

    incomeCategory = await Category.findOne({ userId: user1.id, type: 'income', name: 'Salario' });
    expenseCategory = await Category.findOne({ userId: user1.id, type: 'expense', name: 'Alimentación' });
    account = await Account.findOne({ userId: user1.id, name: 'Efectivo' });
  });

  describe('POST /api/v1/movements', () => {
    test('creates income movement', async () => {
      const res = await request(app)
        .post('/api/v1/movements')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'income',
          description: 'Salario enero',
          amount: 2000,
          categoryId: incomeCategory._id.toString(),
          accountId: account._id.toString(),
          date: '2024-01-15'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('income');
      expect(res.body.data.amount).toBe(2000);
    });

    test('creates expense movement', async () => {
      // Preparación: dotar de saldo suficiente mediante una operación de ingreso válida.
      await request(app)
        .post('/api/v1/movements')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'income',
          description: 'Saldo inicial para gasto',
          amount: 1000,
          categoryId: incomeCategory._id.toString(),
          accountId: account._id.toString(),
          date: '2024-01-15'
        })
        .expect(201);

      const res = await request(app)
        .post('/api/v1/movements')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          description: 'Supermercado',
          amount: 85.50,
          categoryId: expenseCategory._id.toString(),
          accountId: account._id.toString(),
          date: '2024-01-16'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('expense');

      // Saldo final correcto (no negativo indebido); protección INSUFFICIENT_FUNDS intacta.
      const updated = await Account.findById(account._id);
      expect(updated.currentBalance).toBeCloseTo(1000 - 85.50, 2);
      expect(updated.currentBalance).toBeGreaterThanOrEqual(0);
    });

    test('rejects mismatched category type', async () => {
      const res = await request(app)
        .post('/api/v1/movements')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          description: 'Test',
          amount: 100,
          categoryId: incomeCategory._id.toString(),
          accountId: account._id.toString(),
          date: '2024-01-15'
        })
        .expect(422);

      expect(res.body.success).toBe(false);
    });

    test('rejects other user category', async () => {
      const otherCategory = await Category.findOne({ userId: user2.id, type: 'expense' });

      const res = await request(app)
        .post('/api/v1/movements')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          description: 'Test',
          amount: 100,
          categoryId: otherCategory._id.toString(),
          accountId: account._id.toString(),
          date: '2024-01-15'
        })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/movements', () => {
    beforeEach(async () => {
      await Movement.create([
        { userId: user1.id, type: 'income', description: 'Salario', amount: 2000, categoryId: incomeCategory._id, accountId: account._id, date: new Date('2024-01-15') },
        { userId: user1.id, type: 'expense', description: 'Comida', amount: 50, categoryId: expenseCategory._id, accountId: account._id, date: new Date('2024-01-16') },
        { userId: user1.id, type: 'expense', description: 'Transporte', amount: 30, categoryId: expenseCategory._id, accountId: account._id, date: new Date('2024-01-17') }
      ]);
    });

    test('lists movements with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/movements')
        .set('Authorization', `Bearer ${token1}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.totalPages).toBe(2);
    });

    test('filters by type', async () => {
      const res = await request(app)
        .get('/api/v1/movements')
        .set('Authorization', `Bearer ${token1}`)
        .query({ type: 'expense' })
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every(m => m.type === 'expense')).toBe(true);
    });

    test('filters by date range', async () => {
      const res = await request(app)
        .get('/api/v1/movements')
        .set('Authorization', `Bearer ${token1}`)
        .query({ startDate: '2024-01-16', endDate: '2024-01-16' })
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].description).toBe('Comida');
    });

    test('searches by description', async () => {
      const res = await request(app)
        .get('/api/v1/movements')
        .set('Authorization', `Bearer ${token1}`)
        .query({ search: 'Salario' })
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].description).toBe('Salario');
    });
  });

  describe('PUT /api/v1/movements/:id', () => {
    let movementId;

    beforeEach(async () => {
      const movement = await Movement.create({
        userId: user1.id,
        type: 'expense',
        description: 'Original',
        amount: 100,
        categoryId: expenseCategory._id,
        accountId: account._id,
        date: new Date('2024-01-15')
      });
      movementId = movement._id.toString();
    });

    test('updates movement amount', async () => {
      const res = await request(app)
        .put(`/api/v1/movements/${movementId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ amount: 150 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(150);
    });

    test('rejects updating other user movement', async () => {
      const otherMovement = await Movement.create({
        userId: user2.id,
        type: 'expense',
        description: 'Other',
        amount: 50,
        categoryId: (await Category.findOne({ userId: user2.id, type: 'expense' }))._id,
        accountId: (await Account.findOne({ userId: user2.id }))._id,
        date: new Date()
      });

      const res = await request(app)
        .put(`/api/v1/movements/${otherMovement._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ amount: 200 })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/movements/:id', () => {
    let movementId;

    beforeEach(async () => {
      const movement = await Movement.create({
        userId: user1.id,
        type: 'expense',
        description: 'To delete',
        amount: 100,
        categoryId: expenseCategory._id,
        accountId: account._id,
        date: new Date('2024-01-15')
      });
      movementId = movement._id.toString();
    });

    test('soft deletes movement', async () => {
      const res = await request(app)
        .delete(`/api/v1/movements/${movementId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      const deleted = await Movement.findById(movementId);
      expect(deleted.deletedAt).not.toBeNull();
    });
  });
});