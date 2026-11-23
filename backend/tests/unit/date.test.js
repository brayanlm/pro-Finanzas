import { formatDate, startOfMonth, endOfMonth, getMonthYear, getDateRangeForMonth, getLastNMonths, isValidDate } from '../../src/utils/date.js';

describe('Date Utils', () => {
  describe('formatDate', () => {
    test('formats date correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('15/01/2024');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
    });

    test('handles null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('startOfMonth', () => {
    test('returns start of current month', () => {
      const result = startOfMonth(new Date('2024-01-15'));
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('endOfMonth', () => {
    test('returns end of current month', () => {
      const result = endOfMonth(new Date('2024-01-15'));
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });

  describe('getMonthYear', () => {
    test('returns correct month and year', () => {
      const result = getMonthYear(new Date('2024-01-15'));
      expect(result).toEqual({ year: 2024, month: 1 });
    });
  });

  describe('getDateRangeForMonth', () => {
    test('returns correct range for January 2024', () => {
      const { start, end } = getDateRangeForMonth(2024, 1);
      expect(start.getFullYear()).toBe(2024);
      expect(start.getMonth()).toBe(0);
      expect(start.getDate()).toBe(1);
      expect(end.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(0);
      expect(end.getDate()).toBe(31);
    });

    test('handles February leap year', () => {
      const { end } = getDateRangeForMonth(2024, 2);
      expect(end.getDate()).toBe(29);
    });

    test('handles February non-leap year', () => {
      const { end } = getDateRangeForMonth(2023, 2);
      expect(end.getDate()).toBe(28);
    });
  });

  describe('getLastNMonths', () => {
    test('returns correct number of months', () => {
      const months = getLastNMonths(6);
      expect(months).toHaveLength(6);
      expect(months[0]).toHaveProperty('year');
      expect(months[0]).toHaveProperty('month');
      expect(months[0]).toHaveProperty('label');
      expect(months[0]).toHaveProperty('key');
    });
  });

  describe('isValidDate', () => {
    test('validates correct dates', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate(new Date())).toBe(true);
    });

    test('rejects invalid dates', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('2024-13-45')).toBe(false);
    });
  });
});