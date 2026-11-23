import { AppError } from '../../src/utils/AppError.js';

describe('AppError', () => {
  test('creates error with default values', () => {
    const error = new AppError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.isOperational).toBe(true);
  });

  test('creates error with custom values', () => {
    const error = new AppError('Custom error', 400, 'CUSTOM_CODE', { field: 'test' });
    expect(error.message).toBe('Custom error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('CUSTOM_CODE');
    expect(error.details).toEqual({ field: 'test' });
  });

  test('static factory methods', () => {
    expect(AppError.badRequest('Bad').statusCode).toBe(400);
    expect(AppError.unauthorized('Unauth').statusCode).toBe(401);
    expect(AppError.forbidden('Forbidden').statusCode).toBe(403);
    expect(AppError.notFound('Not found').statusCode).toBe(404);
    expect(AppError.conflict('Conflict').statusCode).toBe(409);
    expect(AppError.unprocessable('Unprocessable').statusCode).toBe(422);
    expect(AppError.tooManyRequests('Rate limited').statusCode).toBe(429);
    expect(AppError.internal('Internal').statusCode).toBe(500);
  });

  test('unauthorized with custom code', () => {
    const error = AppError.unauthorized('Token expired', 'TOKEN_EXPIRED');
    expect(error.code).toBe('TOKEN_EXPIRED');
  });

  test('conflict with details', () => {
    const error = AppError.conflict('Duplicate', { field: 'email' });
    expect(error.details).toEqual({ field: 'email' });
  });
});