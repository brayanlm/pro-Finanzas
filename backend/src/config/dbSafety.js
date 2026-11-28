// ============================================================================
// Protección obligatoria contra operaciones destructivas fuera de entornos de
// prueba explícitamente autorizados.
//
// Objetivo: NUNCA permitir `deleteMany`, `dropDatabase`, `dropIndex`,
// `syncIndexes`, limpieza de colecciones, etc. sobre la base de datos real
// (producción). NO se confía únicamente en `NODE_ENV=test`.
// ============================================================================

const splitList = (value, fallback = []) => {
  if (value === undefined || value === null || value === '') return [...fallback];
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
};

/** Bases de datos reservadas del sistema; nunca autorizadas para testing. */
const RESERVED_DB_NAMES = new Set(['', 'admin', 'local', 'config']);

/**
 * Bases de datos de PRODUCCIÓN. Nunca pueden usarse para operaciones
 * destructivas de pruebas. Se pueden ampliar con `PRODUCTION_DB_NAMES`.
 */
export const PRODUCTION_DB_NAMES = new Set(
  [
    'finanzas',          // <-- base de datos real de producción
    'finanzas_prod',
    'finanzas_production',
    'production',
    'prod',
    ...splitList(process.env.PRODUCTION_DB_NAMES)
  ].map((n) => n.toLowerCase())
);

/**
 * Nombres EXPLÍCITAMENTE autorizados para testing (allowlist).
 * Por defecto solo `finanzas_test`. Se pueden ampliar con `TEST_DB_ALLOWLIST`
 * (lista separada por comas). Un nombre de producción nunca se autoriza.
 */
export const authorizedTestDbNames = () =>
  new Set(
    ['finanzas_test', ...splitList(process.env.TEST_DB_ALLOWLIST ?? process.env.TEST_DB_NAMES_ALLOWLIST)]
      .map((n) => n.toLowerCase())
      .filter((n) => !PRODUCTION_DB_NAMES.has(n) && !RESERVED_DB_NAMES.has(n))
  );

/** ¿Estamos en entorno de test? (NO es la única protección; ver más abajo.) */
export const isTestEnvironment = () => process.env.NODE_ENV === 'test';

/** ¿El nombre de base de datos está explícitamente autorizado para testing? */
export const isAuthorizedTestDbName = (name) => {
  const n = String(name || '').toLowerCase();
  if (!n || RESERVED_DB_NAMES.has(n)) return false;
  if (PRODUCTION_DB_NAMES.has(n)) return false;
  return authorizedTestDbNames().has(n);
};

/** ¿El nombre corresponde a producción? */
export const isProductionDbName = (name) => PRODUCTION_DB_NAMES.has(String(name || '').toLowerCase());

/** ¿El URI apunta a un host/cluster de producción conocido (p. ej. Atlas)? */
export const looksLikeProductionUri = (uri = '') => {
  const u = String(uri);
  if (/^mongodb\+srv:\/\//i.test(u)) return true; // Atlas SRV => cluster real
  // Extrae los hosts (sin credenciales, sin querystring).
  const withoutScheme = u.replace(/^mongodb(\+srv)?:\/\//i, '');
  const afterAt = withoutScheme.includes('@') ? withoutScheme.split('@').slice(1).join('@') : withoutScheme;
  const hostsPart = afterAt.split('/')[0];
  const hosts = hostsPart.split(',').map((h) => h.split(':')[0].toLowerCase()).filter(Boolean);
  return hosts.some((h) =>
    h.endsWith('.mongodb.net') ||
    h === 'mongodb.net' ||
    h.endsWith('.mongodb.com') ||
    /(^|\.)atlas(\.|$)/i.test(h)
  );
};

/** Extrae el nombre de base de datos de un URI de MongoDB. */
export const dbNameFromUri = (uri = '') => {
  const u = String(uri);
  const withoutScheme = u.replace(/^mongodb(\+srv)?:\/\//i, '');
  const afterAt = withoutScheme.includes('@') ? withoutScheme.split('@').slice(1).join('@') : withoutScheme;
  const afterHost = afterAt.includes('/') ? afterAt.split('/').slice(1).join('/') : '';
  const name = afterHost.split('?')[0].split('/')[0];
  return name;
};

/** Best-effort: hosts conocidos (no expone credenciales; solo hostnames). */
export const connectedHosts = (mongoose) => {
  try {
    const conn = mongoose?.connection;
    const fromConn = [conn?.host, conn?.name].filter(Boolean);
    const clientHosts = (conn?.client?.options?.hosts || [])
      .map((h) => (typeof h === 'string' ? h : h?.host))
      .filter(Boolean);
    const seedHosts = (conn?.client?.options?.srvHost ? [conn.client.options.srvHost] : []);
    return [...fromConn, ...clientHosts, ...seedHosts].map((h) => String(h));
  } catch {
    return [];
  }
};

/** Nombre real de la base de datos conectada (no el de la variable de entorno). */
export const connectedDbName = (mongoose) => {
  try {
    return mongoose?.connection?.db?.databaseName || '';
  } catch {
    return '';
  }
};

/**
 * Verifica que la conexión actual sea un entorno de TESTING autorizado y
 * seguro para operaciones destructivas. Lanza si no.
 *
 * No confía solo en NODE_ENV: verifica el NOMBRE REAL conectado + allowlist +
 * que no sea base de producción + que no apunte a un cluster de producción +
 * que no se esté usando una conexión de producción como fallback.
 */
export const assertTestDatabaseIsolated = (mongoose, { operation = 'operación destructiva de test' } = {}) => {
  const fail = (reason) => {
    const err = new Error(`[db-safety] BLOQUEADO: ${operation} no permitida. ${reason}`);
    err.name = 'TestDatabaseSafetyError';
    err.isOperational = false;
    throw err;
  };

  if (!isTestEnvironment()) {
    fail(`NODE_ENV='${process.env.NODE_ENV}' no es 'test'. Las operaciones destructivas de prueba requieren entorno de test aislado.`);
  }

  const conn = mongoose?.connection;
  if (!conn || conn.readyState !== 1) {
    fail('no hay una conexión MongoDB activa (readyState!==1).');
  }

  const dbName = connectedDbName(mongoose);
  if (isProductionDbName(dbName)) {
    fail(`la base de datos conectada '${dbName}' es una base de PRODUCCIÓN.`);
  }
  if (!isAuthorizedTestDbName(dbName)) {
    fail(`la base de datos conectada '${dbName}' no está en la allowlist de testing (${[...authorizedTestDbNames()].join(', ')}).`);
  }

  // No permitir operaciones destructivas sobre clusters de producción conocidos.
  const uri = conn?.client?.options?.srvHost
    ? `mongodb+srv://${conn.client.options.srvHost}/${dbName}`
    : `mongodb://${connectedHosts(mongoose)[0] || 'localhost'}/${dbName}`;
  if (looksLikeProductionUri(uri)) {
    fail('el host/cluster conectado parece de producción (Atlas/SRV/mongodb.net).');
  }
  // Si hay un URI de producción en entorno y coincide con el conectado, bloquear.
  const prodUri = process.env.MONGODB_URI || '';
  if (prodUri && !isTestUri(prodUri) && looksLikeProductionUri(prodUri)) {
    fail('MONGODB_URI apunta a un cluster de producción; no se permite reutilizarlo para testing.');
  }

  return { dbName, hosts: connectedHosts(mongoose) };
};

/** ¿El URI es claramente una conexión de TEST (no producción)? */
export const isTestUri = (uri = '') => {
  const name = dbNameFromUri(uri).toLowerCase();
  if (!name || isProductionDbName(name)) return false;
  if (looksLikeProductionUri(uri)) return false;
  return true;
};

/**
 * Protección para conexión en entorno de TEST (defensa en profundidad,
 * independiente de safeClean). NO hay fallback a producción.
 */
export const assertSafeTestConnectionUri = (uri) => {
  if (!isTestEnvironment()) return; // en producción/dev no aplica
  const fail = (reason) => {
    const err = new Error(`[db-safety] BLOQUEADO: conexión de test no aislada. ${reason}`);
    err.name = 'TestDatabaseSafetyError';
    throw err;
  };
  if (!uri) fail('MONGODB_URI no definida en test; no se usa `.env` de producción como fallback.');
  const name = dbNameFromUri(uri);
  if (isProductionDbName(name)) fail(`la base de datos '${name}' es de PRODUCCIÓN.`);
  if (!isAuthorizedTestDbName(name)) fail(`la base de datos '${name}' no está autorizada para testing.`);
  if (looksLikeProductionUri(uri)) fail('el host/cluster parece de producción (Atlas/SRV/mongodb.net).');
};
