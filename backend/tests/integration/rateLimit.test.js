// Rate limiting: protección contra fuerza bruta en dev/prod; límites de test;
// no se comparte estado entre tests; no se desactiva permanentemente.
import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';
import { createRateLimiters } from '../../src/config/rateLimit.js';

describe('Rate limiting', () => {
  test('protección contra fuerza bruta: responde 429 tras superar el máximo', async () => {
    const app = express();
    const limiter = rateLimit({
      windowMs: 60000,
      max: 3,
      standardHeaders: true,
      legacyHeaders: false,
      statusCode: 429,
      message: { success: false, message: 'Demasiadas solicitudes' }
    });
    app.use('/api/v1/auth', limiter);
    app.post('/api/v1/auth/login', (req, res) => res.json({ ok: true }));

    const hits = [];
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/v1/auth/login').send({});
      hits.push(res.status);
    }
    // primeras 3 pasan, siguientes 429
    expect(hits.filter((s) => s === 200).length).toBe(3);
    expect(hits.filter((s) => s === 429).length).toBe(2);
  });

  test('createRateLimiters conserva protección y usa la configuración', () => {
    const { baseOptions, authLimiter, exportLimiter } = createRateLimiters();
    expect(authLimiter.statusCode).toBe(429);
    expect(baseOptions.statusCode).toBe(429);
    expect(exportLimiter.statusCode).toBe(429);
    // en test los límites son altos pero NO infinitos/permanentemente desactivados
    expect(authLimiter.max).toBeGreaterThan(0);
    expect(Number.isFinite(authLimiter.max)).toBe(true);
    expect(baseOptions.max).toBeGreaterThan(0);
  });

  test('instancias separadas no comparten estado', async () => {
    const make = () => {
      const app = express();
      app.use(rateLimit({ windowMs: 60000, max: 1, legacyHeaders: false }));
      app.get('/', (req, res) => res.json({ ok: true }));
      return app;
    };
    const a = make(); const b = make();
    await request(a).get('/'); // consume el único cupo de `a`
    const resB = await request(b).get('/'); // `b` tiene su propio store
    expect(resB.status).toBe(200);
  });
});
