import { clsx } from 'clsx';

export const formatCurrency = (amount, currency = 'EUR', locale = 'es-ES') => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (num, locale = 'es-ES') => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat(locale).format(num);
};

export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    case 'MM/YYYY': return `${month}/${year}`;
    case 'DD/MM': return `${day}/${month}`;
    default: return d.toLocaleDateString('es-ES');
  }
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
  return `${value.toFixed(decimals)}%`;
};

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
    case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'danger': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'warning': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
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
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
};

export const parseAmount = (value) => {
  const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));