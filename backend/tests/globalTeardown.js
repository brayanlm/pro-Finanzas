// globalTeardown: cierra la instancia efímera, cierra conexiones/sesiones y
// limpia archivos temporales EXCLUSIVOS de esta ejecución. No borra producción.
import { rmSync } from 'node:fs';

export default async function globalTeardown() {
  // Cerrar la instancia efímera de MongoDB en memoria.
  try {
    const replSet = globalThis.__JEST_MONGO_REPLSET__;
    if (replSet) await replSet.stop();
  } catch {
    /* noop */
  }

  // Cerrar conexión mongoose residual, si la hubiera (no afecta producción).
  try {
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection?.readyState) await mongoose.disconnect();
  } catch {
    /* noop */
  }

  // Limpiar directorio temporal exclusivo (archivo URI + dir).
  try {
    if (globalThis.__JEST_MONGO_TMP_DIR__) rmSync(globalThis.__JEST_MONGO_TMP_DIR__, { recursive: true, force: true });
  } catch {
    /* noop */
  }
  // Por si `globalThis` no se comparte, limpiar la ruta del archivo explícitamente.
  try {
    if (process.env.TEST_MONGO_URI_FILE) {
      const { dirname } = await import('node:path');
      const { rmSync: rm } = await import('node:fs');
      rm(dirname(process.env.TEST_MONGO_URI_FILE), { recursive: true, force: true });
    }
  } catch {
    /* noop */
  }
}
