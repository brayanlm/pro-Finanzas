export const calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100;
};

export const calculateVariation = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100 * 100) / 100;
};

export const formatCurrency = (amount, currency = 'EUR', locale = 'es-ES') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (num, locale = 'es-ES') => {
  return new Intl.NumberFormat(locale).format(num);
};

export const roundToTwoDecimals = (num) => {
  return Math.round(num * 100) / 100;
};

export const sumBy = (array, key) => {
  return array.reduce((sum, item) => sum + (item[key] || 0), 0);
};

export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const groupKey = item[key];
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
    return groups;
  }, {});
};

export const calculateBudgetAlertLevel = (percentage, thresholds = { warning: 80, danger: 90, critical: 100 }) => {
  if (percentage >= thresholds.critical) return 'critical';
  if (percentage >= thresholds.danger) return 'danger';
  if (percentage >= thresholds.warning) return 'warning';
  return 'normal';
};

export const paginate = (array, page = 1, limit = 20) => {
  const total = array.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: array.slice(start, end),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

export const buildMongoDateRange = (startDate, endDate) => {
  const query = {};
  if (startDate) query.$gte = new Date(startDate);
  if (endDate) query.$lte = new Date(endDate);
  return Object.keys(query).length ? query : null;
};