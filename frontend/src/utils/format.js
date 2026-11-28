import { clsx } from 'clsx';

export const formatCurrency = (amount, currency = 'EUR', locale = 'es-ES') => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  }).format(amount);
};

export const formatCompact = (num, locale = 'es-ES') => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(num);
};

export const formatNumber = (num, locale = 'es-ES') => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat(locale).format(num);
};

export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  // UTC para evitar desfases por zona horaria (la app trabaja con fechas UTC del backend).
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();

  switch (format) {
    case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    case 'MM/YYYY': return `${month}/${year}`;
    case 'DD/MM': return `${day}/${month}`;
    default: return d.toLocaleDateString('es-ES', { timeZone: 'UTC' });
  }
};

export const formatMonth = (year, month) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const m = Number(month);
  return `${months[m - 1] ?? m}/${year}`;
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';
  const v = Number(value);
  if (isNaN(v)) return '-';
  return `${v.toFixed(decimals)}%`;
};

/* --- Color semántico para el tipo de movimiento/categoría --- */
export const getTypeColorClass = (type) => (type === 'income' ? 'text-income-600 dark:text-income-400' : 'text-expense-600 dark:text-expense-400');

export const getVariationColor = (variation) => {
  if (variation > 0) return 'text-income-600 dark:text-income-400';
  if (variation < 0) return 'text-expense-600 dark:text-expense-400';
  return 'text-gray-500 dark:text-gray-400';
};

export const getVariationIcon = (variation) => {
  if (variation > 0) return 'trending-up';
  if (variation < 0) return 'trending-down';
  return 'minus';
};

export const getAlertLevelColor = (level) => {
  switch (level) {
    case 'critical': return 'text-expense-600 dark:text-expense-400';
    case 'danger': return 'text-warning-600 dark:text-warning-400';
    case 'warning': return 'text-warning-600 dark:text-warning-400';
    default: return 'text-income-600 dark:text-income-400';
  }
};

export const getAlertLevelLabel = (level) => {
  switch (level) {
    case 'critical': return 'Crítico';
    case 'danger': return 'Peligro';
    case 'warning': return 'Advertencia';
    default: return 'Normal';
  }
};

/* --- Color del indicador de progreso de presupuestos --- */
export const getProgressColor = (percentage) => {
  if (percentage >= 90) return 'bg-expense-500';
  if (percentage >= 70) return 'bg-warning-500';
  if (percentage > 0) return 'bg-income-500';
  return 'bg-gray-300 dark:bg-surfaceRaised';
};

export const cn = (...classes) => clsx(classes);

export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const generateId = () => Math.random().toString(36).substring(2, 15);

export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const getInitials = (name) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
};

export const parseAmount = (value) => {
  const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
