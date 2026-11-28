// Integridad financiera de movimientos: atomicidad, idempotencia, no duplicados,
// no overdraft, saldos consistentes, errores que no dejan saldos inconsistentes.
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';
import Movement from '../../src/models/Movement.js';
import Account from '../../src/models/Account.js';
import Category from '../../src/models/Category.js';
import { safeCleanTestDatabase } from '../helpers/safeClean.js';

const register = async (email) => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: 'Secure123!', confirmPassword: 'Secure123!', name: 'Safety User' });
  return res.body.data;
};

describe('Movement safety (integridad financiera)', () => {
  let token; let userId; let expenseCategory; let incomeCategory; let account;

  beforeAll(async () => { await connectDB(); });
  afterAll(async () => { await disconnectDB(); });

  beforeEach(async () => {
    await safeCleanTestDatabase(mongoose);
    const data = await register(`safety-${Date.now()}-${Math.random()}@test.com`);
    token = data.token; userId = data.user.id;
    expenseCategory = await Category.findOne({ userId, type: 'expense', name: 'Alimentación' });
    incomeCategory = await Category.findOne({ userId, type: 'income', name: 'Salario' });
    account = await Account.findOne({ userId, name: 'Efectivo' });
  });

  const postMovement = (payload) =>
    request(app).post('/api/v1/movements').set('Authorization', `Bearer ${token}`).send(payload);

  const reloadBalance = async () => (await Account.findById(account._id)).currentBalance;

  test('movimiento + actualización de saldo son atómicos; errores no dejan saldos inconsistentes', async () => {
    const startBalance = await reloadBalance();
    const before = await Movement.countDocuments({ userId });

    // Categoría no coincide -> transacción revierte (no crea movimiento ni toca saldo).
    const bad = await postMovement({
      type: 'expense', description: 'x', amount: 50,
      categoryId: incomeCategory._id.toString(), accountId: account._id.toString(), date: '2024-01-15'
    });
    expect(bad.status).toBe(422);

    expect(await Movement.countDocuments({ userId })).toBe(before);
    expect(await reloadBalance()).toBe(startBalance);
  });

  test('idempotencia: la misma clave no crea movimientos duplicados', async () => {
    const payload = {
      type: 'income', description: 'dup', amount: 100,
      categoryId: incomeCategory._id.toString(), accountId: account._id.toString(),
      date: '2024-01-15', idempotencyKey: 'key-123'
    };
    const r1 = await postMovement(payload);
    const r2 = await postMovement(payload);

    expect(r1.status).toBe(201);
    expect([200, 201]).toContain(r2.status);
    expect(r2.body.idempotent || r2.status === 200 || r2.status === 201).toBe(true);
    expect(await Movement.countDocuments({ userId, idempotencyKey: 'key-123', deletedAt: null })).toBe(1);
  });

  test('no se permiten retiros superiores al saldo disponible', async () => {
    // sin saldo -> expense rechazado y no crea movimiento ni inconsistencia
    const res = await postMovement({
      type: 'expense', description: 'overdraft', amount: 999999,
      categoryId: expenseCategory._id.toString(), accountId: account._id.toString(), date: '2024-01-15'
    });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INSUFFICIENT_FUNDS');
    expect(await Movement.countDocuments({ userId })).toBe(0);
    expect(await reloadBalance()).toBe(0);
  });

  test('ingreso recalcula saldo de forma atómica y precisa', async () => {
    const res = await postMovement({
      type: 'income', description: 'salario', amount: 100.1,
      categoryId: incomeCategory._id.toString(), accountId: account._id.toString(), date: '2024-01-15'
    });
    expect(res.status).toBe(201);
    expect(await reloadBalance()).toBeCloseTo(100.1, 2);
  });

  test('no permite acceder a recursos de otro usuario', async () => {
    const other = await register(`other-${Date.now()}@test.com`);
    const otherCat = await Category.findOne({ userId: other.user.id, type: 'expense' });
    const res = await postMovement({
      type: 'expense', description: 'x', amount: 10,
      categoryId: otherCat._id.toString(), accountId: account._id.toString(), date: '2024-01-15'
    });
    expect(res.status).toBe(404);
  });
});
