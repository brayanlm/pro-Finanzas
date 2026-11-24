import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatPercent, cn, getVariationColor, getVariationIcon } from '../src/utils/format';

describe('Format Utils', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toContain('1.234,56');
      expect(formatCurrency(0)).toContain('0,00');
      expect(formatCurrency(1000000)).toContain('1.000.000,00');
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-500)).toContain('-500,00');
    });
  });

  describe('formatDate', () => {
    it('formats dates in DD/MM/YYYY', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('handles different formats', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
      expect(formatDate(date, 'MM/YYYY')).toBe('01/2024');
    });

    it('handles null/undefined', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
    });
  });

  describe('formatPercent', () => {
    it('formats percentages correctly', () => {
      expect(formatPercent(50)).toBe('50.0%');
      expect(formatPercent(33.333)).toBe('33.3%');
      expect(formatPercent(100)).toBe('100.0%');
    });
  });

  describe('cn (classnames)', () => {
    it('joins class names', () => {
      expect(cn('a', 'b', 'c')).toBe('a b c');
    });

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });

    it('handles objects', () => {
      expect(cn({ active: true, disabled: false })).toBe('active');
    });
  });

  describe('getVariationColor', () => {
    it('returns green for positive', () => {
      expect(getVariationColor(10)).toContain('income');
    });

    it('returns red for negative', () => {
      expect(getVariationColor(-5)).toContain('expense');
    });

    it('returns gray for zero', () => {
      expect(getVariationColor(0)).toContain('gray');
    });
  });

  describe('getVariationIcon', () => {
    it('returns trending-up for positive', () => {
      expect(getVariationIcon(10)).toBe('trending-up');
    });

    it('returns trending-down for negative', () => {
      expect(getVariationIcon(-5)).toBe('trending-down');
    });

    it('returns minus for zero', () => {
      expect(getVariationIcon(0)).toBe('minus');
    });
  });
});