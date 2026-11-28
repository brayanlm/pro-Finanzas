import mongoose from 'mongoose';
import {
  assertSafeTestConnectionUri,
  assertTestDatabaseIsolated,
  isTestEnvironment
} from './dbSafety.js';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  // En `test`, verificar aislamiento ANTES de conectar. JAMÁS hay fallback a
  // producción: si la conexión de pruebas falla, se lanza error.
  assertSafeTestConnectionUri(uri);

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });

    isConnected = conn.connections[0].readyState === 1;

    // Verificar el NOMBRE REAL conectado (no solo la variable de entorno) y que
    // sea un entorno de testing explícitamente autorizado antes de permitir nada.
    if (isTestEnvironment()) {
      try {
        assertTestDatabaseIsolated(mongoose, { operation: 'conexión en entorno de test' });
      } catch (safetyError) {
        await mongoose.disconnect();
        isConnected = false;
        throw safetyError;
      }
    }

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

export const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('MongoDB disconnected');
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  isConnected = false;
});

// El cierre controlado de señales vive en server.js (graceful shutdown centralizado).