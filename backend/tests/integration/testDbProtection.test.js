// Verifica que las protecciones contra uso accidental de producción funcionan.
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../src/config/database.js';
import { assertTestDatabaseIsolated, isTestEnvironment } from '../../src/config/dbSafety.js';
import { safeCleanTestDatabase } from '../helpers/safeClean.js';

describe('Protección contra operaciones destructivas en producción', () => {
  beforeAll(async () => { await connectDB(); });
  afterAll(async () => { await disconnectDB(); });

  test('la base de datos conectada es de testing aislada y autorizada', () => {
    expect(isTestEnvironment()).toBe(true);
    const { dbName } = assertTestDatabaseIsolated(mongoose);
    expect(dbName).toBe('finanzas_test');
    expect(dbName).not.toBe('finanzas');
    expect(mongoose.connection.readyState).toBe(1);
  });

  test('no apunta a producción Atlas', () => {
    const host = String(mongoose.connection.host || '');
    expect(host.includes('mongodb.net')).toBe(false);
  });

  test('safeCleanTestDatabase funciona SOLO sobre BD de testing', async () => {
    const res = await safeCleanTestDatabase(mongoose, ['users']);
    expect(res.dbName).toBe('finanzas_test');
  });

  test('rechaza limpieza si el nombre conectado no está autorizado', async () => {
    // Simulación: no se puede borrar si no está conectado a una BD de test autorizada.
    const realAssert = assertTestDatabaseIsolated(mongoose);
    expect(realAssert.dbName).toBe('finanzas_test');

    // Guard puro sobre una conexión falsa a producción.
    expect(() =>
      assertTestDatabaseIsolated(
        { connection: { readyState: 1, db: { databaseName: 'finanzas' }, host: 'x', client: { options: { hosts: [] } } } }
      )
    ).toThrow(/producción|autorizada/i);
  });

  test('NODE_ENV=test por sí solo no basta; se verifica nombre real + allowlist', () => {
    expect(() =>
      assertTestDatabaseIsolated(
        { connection: { readyState: 1, db: { databaseName: 'finanzas' }, host: '127.0.0.1', client: { options: { hosts: [] } } } }
      )
    ).toThrow();
  });
});
