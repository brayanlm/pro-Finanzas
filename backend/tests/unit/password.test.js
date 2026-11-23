import { hashPassword, verifyPassword, validatePasswordStrength } from '../../src/utils/password.js';

describe('Password Utils', () => {
  describe('validatePasswordStrength', () => {
    test('validates strong password', () => {
      const result = validatePasswordStrength('Secure123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects short password', () => {
      const result = validatePasswordStrength('Abc1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Mínimo 8 caracteres');
    });

    test('rejects missing uppercase', () => {
      const result = validatePasswordStrength('secure123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Al menos una mayúscula');
    });

    test('rejects missing lowercase', () => {
      const result = validatePasswordStrength('SECURE123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Al menos una minúscula');
    });

    test('rejects missing number', () => {
      const result = validatePasswordStrength('Secureabc!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Al menos un número');
    });

    test('rejects missing symbol', () => {
      const result = validatePasswordStrength('Secure123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Al menos un símbolo');
    });
  });

  describe('hashPassword & verifyPassword', () => {
    test('hashes and verifies password', async () => {
      const password = 'Secure123!';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test('rejects wrong password', async () => {
      const hash = await hashPassword('Secure123!');
      const isValid = await verifyPassword('Wrong456!', hash);
      expect(isValid).toBe(false);
    });

    test('produces different hashes for same password', async () => {
      const password = 'Secure123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });
});