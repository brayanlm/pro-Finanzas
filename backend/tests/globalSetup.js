// globalSetup: arranca UNA instancia efímera aislada (MongoMemoryReplSet con
// replica set de 1 nodo para soportar transacciones) y publica su URI.
//
// AISLAMIENTO POR EJECUCIÓN: directorio + archivo temporal EXCLUSIVOS por
// ejecución (mkdtemp + pid + timestamp). No usa un nombre compartido, por lo
// que varias ejecuciones de Jest simultáneas no colisionan.
//
// No toca producción, no usa credenciales reales, no hay fallback a Atlas.
// `process.env.TEST_MONGO_URI_FILE` se propaga a los workers de Jest.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const TEST_DB_NAME = 'finanzas_test';

// ¿Es una ejecución que SOLO necesita tests unitarios (no BD)? Entonces no se
// inicia MongoDB en memoria. Se inspecciona `testPathPatterns`/`testPathPattern`.
const isUnitOnlyRun = (globalConfig = {}) => {
  const patterns = [
    ...(Array.isArray(globalConfig.testPathPatterns) ? globalConfig.testPathPatterns : []),
    globalConfig.testPathPattern || '',
    process.env.JEST_TEST_PATH_PATTERN || ''
  ].join(' ');
  return /tests[\\/]unit/.test(patterns) || /(^|\s)unit(\s|$)/.test(patterns);
};

export default async function globalSetup(globalConfig = {}) {
  const unitOnly = isUnitOnlyRun(globalConfig);
  process.env.JEST_MONGO_UNIT_ONLY = unitOnly ? '1' : '0';

  // Directorio temporal EXCLUSIVO por ejecución.
  const dir = mkdtempSync(join(tmpdir(), `jest-mongo-${process.pid}-`));
  const uriFile = join(dir, 'mongo-memory-server.json');

  // No iniciar MongoDB en memoria para tests unitarios que no lo necesitan,
  // salvo que se pida explícitamente una instancia de pruebas independiente.
  if (unitOnly && !process.env.TEST_MONGODB_URI) {
    process.env.TEST_MONGO_URI_FILE = '';
    globalThis.__JEST_MONGO_TMP_DIR__ = dir;
    return;
  }

  // Si el usuario provee una instancia de pruebas independiente, no se inicia memoria.
  if (process.env.TEST_MONGODB_URI) {
    writeFileSync(uriFile, JSON.stringify({ uri: process.env.TEST_MONGODB_URI }));
    process.env.TEST_MONGO_URI_FILE = uriFile;
    globalThis.__JEST_MONGO_URI_FILE__ = uriFile;
    globalThis.__JEST_MONGO_TMP_DIR__ = dir;
    return;
  }

  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger', dbName: TEST_DB_NAME },
    instanceOpts: [{ dbName: TEST_DB_NAME }]
  });

  const uri = replSet.getUri(TEST_DB_NAME);
  writeFileSync(uriFile, JSON.stringify({ uri }));
  process.env.TEST_MONGO_URI_FILE = uriFile;

  // Referencias para globalTeardown (mismo proceso de Jest).
  globalThis.__JEST_MONGO_REPLSET__ = replSet;
  globalThis.__JEST_MONGO_URI_FILE__ = uriFile;
  globalThis.__JEST_MONGO_TMP_DIR__ = dir;
}
