import {
  isProductionDbName,
  isAuthorizedTestDbName,
  looksLikeProductionUri,
  dbNameFromUri,
  assertSafeTestConnectionUri,
  assertTestDatabaseIsolated,
  PRODUCTION_DB_NAMES,
  authorizedTestDbNames
} from '../../src/config/dbSafety.js';

const withEnv = (env, fn) => {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  try { return fn(); } finally {
    for (const k of Object.keys(env)) {
      if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
    }
  }
};

describe('dbSafety (protección obligatoria contra datos reales)', () => {
  test('producción "finanzas" nunca es base autorizada de testing', () => {
    expect(isProductionDbName('finanzas')).toBe(true);
    expect(isAuthorizedTestDbName('finanzas')).toBe(false);
    expect(PRODUCTION_DB_NAMES.has('finanzas')).toBe(true);
  });

  test('solo nombres explícitamente autorizados pasan (allowlist)', () => {
    expect(isAuthorizedTestDbName('finanzas_test')).toBe(true);
    expect(isAuthorizedTestDbName('finanzas_test_2')).toBe(false); // no prefijo; allowlist estricta
    expect(isAuthorizedTestDbName('otra_cosa')).toBe(false);
    expect(isAuthorizedTestDbName('admin')).toBe(false);
    expect(isAuthorizedTestDbName('local')).toBe(false);
    expect(isAuthorizedTestDbName('')).toBe(false);
    expect(authorizedTestDbNames().has('finanzas')).toBe(false);
  });

  test('no confía solo en NODE_ENV=test', () => {
    withEnv({ NODE_ENV: 'test', MONGODB_URI: 'mongodb://user:pass@host/finanzas' }, () => {
      expect(() => assertSafeTestConnectionUri('mongodb://user:pass@host/finanzas')).toThrow();
    });
  });

  test('bloquea Atlas / mongodb+srv / clusters mongodb.net', () => {
    expect(looksLikeProductionUri('mongodb+srv://u:p@cluster0.mongodb.net/finanzas_test')).toBe(true);
    expect(looksLikeProductionUri('mongodb://u:p@shard.mongodb.net/finanzas_test')).toBe(true);
    expect(looksLikeProductionUri('mongodb://127.0.0.1:27017/finanzas_test')).toBe(false);
    withEnv({ NODE_ENV: 'test' }, () => {
      expect(() => assertSafeTestConnectionUri('mongodb+srv://u:p@c.mongodb.net/finanzas_test')).toThrow();
      expect(() => assertSafeTestConnectionUri('mongodb://127.0.0.1:27017/finanzas')).toThrow();
      expect(() => assertSafeTestConnectionUri('mongodb://127.0.0.1:27017/otra')).toThrow();
      expect(() => assertSafeTestConnectionUri('mongodb://127.0.0.1:27017/finanzas_test')).not.toThrow();
    });
  });

  test('en producción/desarrollo no aplica el guard de test', () => {
    withEnv({ NODE_ENV: 'production' }, () => {
      expect(() => assertSafeTestConnectionUri('mongodb+srv://u:p@c.mongodb.net/finanzas')).not.toThrow();
    });
    withEnv({ NODE_ENV: 'development' }, () => {
      expect(() => assertSafeTestConnectionUri('mongodb+srv://u:p@c.mongodb.net/finanzas')).not.toThrow();
    });
  });

  test('no hay fallback a producción si no hay URI de test', () => {
    withEnv({ NODE_ENV: 'test', MONGODB_URI: 'mongodb+srv://u:p@c.mongodb.net/finanzas' }, () => {
      expect(() => assertSafeTestConnectionUri(undefined)).toThrow();
    });
  });

  test('extrae el nombre real de base de datos del URI', () => {
    expect(dbNameFromUri('mongodb://127.0.0.1:27017/finanzas_test?retryWrites=true')).toBe('finanzas_test');
    expect(dbNameFromUri('mongodb+srv://u:p@c.mongodb.net/finanzas')).toBe('finanzas');
  });

  test('assertTestDatabaseIsolated exige conexión real + allowlist + test + no prod', () => {
    const fakeProd = { connection: { readyState: 1, db: { databaseName: 'finanzas' }, host: '127.0.0.1' } };
    const fakeOther = { connection: { readyState: 1, db: { databaseName: 'cualquier' }, host: '127.0.0.1' } };
    const fakeTest = { connection: { readyState: 1, db: { databaseName: 'finanzas_test' }, host: '127.0.0.1', client: { options: { hosts: [{ host: '127.0.0.1' }] } } } };

    withEnv({ NODE_ENV: 'test', MONGODB_URI: 'mongodb://127.0.0.1:27017/finanzas_test', TEST_DB_ALLOWLIST: 'finanzas_test' }, () => {
      expect(() => assertTestDatabaseIsolated(fakeProd)).toThrow();
      expect(() => assertTestDatabaseIsolated(fakeOther)).toThrow();
      expect(() => assertTestDatabaseIsolated(fakeTest)).not.toThrow();
    });

    withEnv({ NODE_ENV: 'production', MONGODB_URI: 'mongodb://127.0.0.1/finanzas_test', TEST_DB_ALLOWLIST: 'finanzas_test' }, () => {
      expect(() => assertTestDatabaseIsolated(fakeTest)).toThrow(); // no confiar en NODE_ENV; exige test
    });
  });
});
