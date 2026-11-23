import { generateToken, verifyToken, generateAccessToken } from '../../src/utils/jwt.js';

describe('JWT Utils', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: 'USER'
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-32chars';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.JWT_ISSUER = 'finanzas-app';
    process.env.JWT_AUDIENCE = 'finanzas-app-users';
  });

  describe('generateToken', () => {
    test('generates valid JWT', () => {
      const token = generateToken({ sub: mockUser._id, role: mockUser.role });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    test('includes custom claims', () => {
      const token = generateToken({ sub: mockUser._id, role: mockUser.role, custom: 'claim' });
      const decoded = verifyToken(token);
      expect(decoded.custom).toBe('claim');
    });
  });

  describe('verifyToken', () => {
    test('verifies valid token', () => {
      const token = generateToken({ sub: mockUser._id, role: mockUser.role });
      const decoded = verifyToken(token);
      expect(decoded.sub).toBe(mockUser._id);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.iss).toBe('finanzas-app');
      expect(decoded.aud).toBe('finanzas-app-users');
    });

    test('throws on invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow();
    });

    test('throws on expired token', () => {
      const expiredToken = generateToken({ sub: mockUser._id }, { expiresIn: '-1s' });
      expect(() => verifyToken(expiredToken)).toThrow('TokenExpiredError');
    });
  });

  describe('generateAccessToken', () => {
    test('generates access token with user data', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyToken(token);
      expect(decoded.sub).toBe(mockUser._id);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.email).toBe(mockUser.email);
    });
  });
});