import { getConfig } from './config/env.js';
import { connectDB } from './config/database.js';
import app from './app.js';

const config = getConfig();

// No dejar el proceso en estado indefinido ante errores no capturados.
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err?.message, err?.stack);
  // Tras una excepción no capturada, salimos para que un supervisor reinicie.
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(config.PORT, () => {
      console.log(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        const { disconnectDB } = await import('./config/database.js');
        await disconnectDB();
        console.log('Server closed');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();