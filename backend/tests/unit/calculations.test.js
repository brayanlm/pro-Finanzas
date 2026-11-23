import { calculatePercentage, calculateVariation, formatCurrency, roundToTwoDecimals, paginate, buildMongoDateRange } from '../../src/utils/calculations.js';

describe('Calculations Utils', () => {
  describe('calculatePercentage', () => {
    test('calculates percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(33, 100)).toBe(33);
      expect(calculatePercentage(1, 3)).toBe(33.33);
    });

    test('handles zero total', () => {
      expect(calculatePercentage(50, 0)).toBe(0);
      expect(calculatePercentage(0, 0)).toBe(0);
    });
  });

  describe('calculateVariation', () => {
    test('calculates positive variation', () => {
      expect(calculateVariation(110, 100)).toBe(10);
      expect(calculateVariation(150, 100)).toBe(50);
    });

    test('calculates negative variation', () => {
      expect(calculateVariation(90, 100)).toBe(-10);
      expect(calculateVariation(50, 100)).toBe(-50);
    });

    test('handles zero previous', () => {
      expect(calculateVariation(100, 0)).toBe(100);
      expect(calculateVariation(0, 0)).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    test('formats EUR correctly', () => {
      expect(formatCurrency(1234.56)).toContain('1.234,56');
      expect(formatCurrency(0)).toContain('0,00');
    });
  });

  describe('roundToTwoDecimals', () => {
    test('rounds correctly', () => {
      expect(roundToTwoDecimals(1.234)).toBe(1.23);
      expect(roundToTwoDecimals(1.235)).toBe(1.24);
      expect(roundToTwoDecimals(1.2)).toBe(1.2);
    });
  });

  describe('paginate', () => {
    test('paginates array correctly', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = paginate(arr, 1, 3);
      expect(result.data).toEqual([1, 2, 3]);
      expect(result.meta.total).toBe(10);
      expect(result.meta.totalPages).toBe(4);
      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(false);
    });

    test('handles last page', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = paginate(arr, 2, 3);
      expect(result.data).toEqual([4, 5]);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrev).toBe(true);
    });
  });

  describe('buildMongoDateRange', () => {
    test('builds range with both dates', () => {
      const range = buildMongoDateRange('2024-01-01', '2024-01-31');
      expect(range).toEqual({
        $gte: new Date('2024-01-01'),
        $lte: new Date('2024-01-31')
      });
    });

    test('builds range with only start', () => {
      const range = buildMongoDateRange('2024-01-01', null);
      expect(range).toEqual({ $gte: new Date('2024-01-01') });
    });

    test('builds range with only end', () => {
      const range = buildMongoDateRange(null, '2024-01-31');
      expect(range).toEqual({ $lte: new Date('2024-01-31') });
    });

    test('returns null for no dates', () => {
      expect(buildMongoDateRange(null, null)).toBeNull();
    });
  });
});