// ============================================================================
// Configuración de testing (setupFilesAfterEnv).
// Se ejecuta SINCRÓNICAMENTE ANTES de importar la app y antes de conectar,
// para que NADA de producción (Atlas `.env`, MONGODB_URI, credenciales) se
// inyecte. Los tests SIEMPRE usan un MongoDB de prueba aislado y autorizado.
// ============================================================================
import { readFileSync } from 'node:fs';
import { jest } from '@jest/globals';
import { assertSafeTestConnectionUri } from '../src/config/dbSafety.js';

jest.setTimeout(20000);

const readMemoryServerUri = () => {
  // 1) URI explícita de una instancia de pruebas independiente (permitida).
  if (process.env.TEST_MONGODB_URI) return process.env.TEST_MONGODB_URI;
  // 2) URI efímera publicada por `mongodb-memory-server` (globalSetup).
  //    Nombre EXCLUSIVO por ejecución (no hay archivo compartido fijo).
  const file = process.env.TEST_MONGO_URI_FILE;
  if (!file) return null;
  try {
    const raw = readFileSync(file, 'utf8');
    return JSON.parse(raw).uri || null;
  } catch {
    return null;
  }
};

// Variables de test SIN secretos de producción.
const TEST_ENV = {
  NODE_ENV: 'test',
  JWT_SECRET: 'test-secret-key-for-testing-purposes-only-32chars',
  JWT_EXPIRES_IN: '1h',
  JWT_ISSUER: 'finanzas-app',
  JWT_AUDIENCE: 'finanzas-app-users',
  FRONTEND_URL: 'http://localhost:5173',
  EMAIL_HOST: 'smtp.test.com',
  EMAIL_PORT: '587',
  EMAIL_USER: 'test@test.com',
  EMAIL_PASSWORD: 'test',
  EMAIL_FROM: 'Test <test@test.com>',
  // Límites ALTOS en test (sin desactivar permanentemente protección en dev/prod).
  RATE_LIMIT_WINDOW_MS: '60000',
  RATE_LIMIT_MAX_REQUESTS: '100000',
  RATE_LIMIT_AUTH_MAX: '100000',
  RATE_LIMIT_EXPORT_MAX: '100000',
  RATE_LIMIT_EXPORT_WINDOW_MS: '3600000',
  // Autorización explícita de la base de datos de testing.
  TEST_DB_ALLOWLIST: 'finanzas_test'
};

const applyTestEnv = () => {
  process.env.NODE_ENV = 'test';
  Object.assign(process.env, TEST_ENV);

  // Borra CUALQUIER herencia de producción: nunca fallback a `.env`/Atlas.
  delete process.env.MONGODB_URI;

  const uri = readMemoryServerUri();
  if (uri) {
    process.env.MONGODB_URI = uri;
    assertSafeTestConnectionUri(uri); // verifica allowlist + no producción + no Atlas
    return uri;
  }

  // Pruebas unitarias que no necesitan BD: no requiere MongoDB, pero tampoco
  // se usa ninguna conexión de producción.
  if (process.env.JEST_MONGO_UNIT_ONLY === '1') return null;

  throw new Error(
    '[test setup] No hay conexión MongoDB de pruebas (ni TEST_MONGODB_URI ni instancia efímera). ' +
      'NO se usa la `.env` de producción como fallback. Abortando.'
  );
};

// Aplicar síncronamente (antes de cargar app / dotenv / connectDB).
applyTestEnv();

beforeAll(() => {
  applyTestEnv();
});

afterAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 200));
});
