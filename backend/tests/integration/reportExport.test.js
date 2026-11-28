// Exportación PDF + Excel: funciona, datos correctos del usuario, sin cross-tenant.
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';
import Account from '../../src/models/Account.js';
import Category from '../../src/models/Category.js';
import { safeCleanTestDatabase } from '../helpers/safeClean.js';

const register = async (email) => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: 'Secure123!', confirmPassword: 'Secure123!', name: 'Exporter' });
  return res.body.data;
};

const makeExpense = async (token, userId, amount, description) => {
  const expenseCategory = await Category.findOne({ userId, type: 'expense', name: 'Alimentación' });
  const account = await Account.findOne({ userId, name: 'Efectivo' });
  // saldo inicial vía ingreso válido
  const incomeCategory = await Category.findOne({ userId, type: 'income', name: 'Salario' });
  await request(app).post('/api/v1/movements').set('Authorization', `Bearer ${token}`)
    .send({ type: 'income', description: 'saldo', amount: 5000, categoryId: incomeCategory._id.toString(), accountId: account._id.toString(), date: '2024-01-01' })
    .expect(201);
  await request(app).post('/api/v1/movements').set('Authorization', `Bearer ${token}`)
    .send({ type: 'expense', description, amount, categoryId: expenseCategory._id.toString(), accountId: account._id.toString(), date: '2024-01-15' })
    .expect(201);
};

describe('Reports export (PDF + Excel)', () => {
  let token1; let user1; let token2; let user2;

  beforeAll(async () => { await connectDB(); });
  afterAll(async () => { await disconnectDB(); });

  beforeEach(async () => {
    await safeCleanTestDatabase(mongoose);
    const d1 = await register(`exp1-${Date.now()}@test.com`);
    token1 = d1.token; user1 = d1.user;
    await makeExpense(token1, user1.id, 42.5, 'Gasto privado usuario1');
    const d2 = await register(`exp2-${Date.now()}@test.com`);
    token2 = d2.token; user2 = d2.user;
    await makeExpense(token2, user2.id, 999.99, 'Gasto secreto usuario2');
  });

  test('PDF export 200 application/pdf no vacío', async () => {
    const res = await request(app)
      .get('/api/v1/reports/export?format=pdf&year=2024&month=1')
      .set('Authorization', `Bearer ${token1}`)
      .buffer(true)
      .parse((res, cb) => { const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => cb(null, Buffer.concat(chunks))); });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body.length).toBeGreaterThan(100);
    expect(res.body.slice(0, 4).toString()).toBe('%PDF');
  });

  test('Excel export 200 XLSX no vacío', async () => {
    const res = await request(app)
      .get('/api/v1/reports/export?format=excel&year=2024&month=1')
      .set('Authorization', `Bearer ${token1}`)
      .buffer(true)
      .parse((res, cb) => { const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => cb(null, Buffer.concat(chunks))); });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
    expect(res.body.length).toBeGreaterThan(100);
    // XLSX es un ZIP (PK)
    expect(res.body.slice(0, 2).toString()).toBe('PK');
    expect(res.headers['content-disposition']).toContain('.xlsx');
  });

  test('Excel contiene datos correctos del usuario y NO datos de otro usuario', async () => {
    const res = await request(app)
      .get('/api/v1/reports/export?format=excel&year=2024&month=1')
      .set('Authorization', `Bearer ${token1}`)
      .buffer(true)
      .parse((res, cb) => { const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => cb(null, Buffer.concat(chunks))); });
    const { default: ExcelJS } = await import('exceljs');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body);
    const movements = wb.getWorksheet('Movimientos');
    let text = '';
    movements.eachRow(r => { text += r.values.join('|') + '\n'; });
    expect(text).toContain('Gasto privado usuario1');
    expect(text).not.toContain('Gasto secreto usuario2');
    expect(text).not.toContain('usuario2');
  });

  test('preview movements no expone otros usuarios', async () => {
    const res = await request(app)
      .get('/api/v1/reports/movements?year=2024&month=1')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('Gasto secreto usuario2');
  });
});
