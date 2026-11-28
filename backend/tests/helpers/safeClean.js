// Limpieza de testing PROTEGIDA. Solo borra documentos dentro de una base de
// datos de testing explícitamente autorizada y verificada. NUNCA producción.
// No usa dropDatabase / dropIndex / syncIndexes. No toca índices ni datos reales.
import { assertTestDatabaseIsolated } from '../../src/config/dbSafety.js';

export const TEST_COLLECTIONS = ['users', 'categories', 'accounts', 'movements', 'budgets'];

export async function safeCleanTestDatabase(mongoose, collections = TEST_COLLECTIONS) {
  // Verifica entorno test + nombre REAL conectado + allowlist + no producción.
  const { dbName } = assertTestDatabaseIsolated(mongoose, { operation: 'limpieza de colecciones de test' });

  for (const name of collections) {
    // Solo `deleteMany` sobre la base de testing; jamás `drop`, ni índices.
    await mongoose.connection.db.collection(name).deleteMany({});
  }
  return { dbName, cleaned: [...collections] };
}
