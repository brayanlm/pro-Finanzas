import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { loadConfig } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { helmetConfig } from './config/helmet.js';
import { createRateLimiters } from './config/rateLimit.js';
import { setupRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware.js';
import { sanitizeQuery } from './middlewares/validationMiddleware.js';

loadConfig();

const app = express();

app.use(helmet(helmetConfig()));
app.use(cors(corsOptions()));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeQuery);

const { baseOptions, authLimiter, exportLimiter } = createRateLimiters();

app.use(rateLimit(baseOptions));
app.use('/api/v1/auth', rateLimit(authLimiter));
app.use('/api/v1/reports/export', rateLimit(exportLimiter));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
  const { default: mongoose } = await import('mongoose');
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'ready' : 'unavailable',
    database: dbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

setupRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;