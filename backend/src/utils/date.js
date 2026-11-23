import dayjs from 'dayjs';

export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatDateTime = (date, format = 'DD/MM/YYYY HH:mm') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const startOfMonth = (date = new Date()) => {
  return dayjs(date).startOf('month').toDate();
};

export const endOfMonth = (date = new Date()) => {
  return dayjs(date).endOf('month').toDate();
};

export const startOfDay = (date = new Date()) => {
  return dayjs(date).startOf('day').toDate();
};

export const endOfDay = (date = new Date()) => {
  return dayjs(date).endOf('day').toDate();
};

export const addMonths = (date, months) => {
  return dayjs(date).add(months, 'month').toDate();
};

export const subMonths = (date, months) => {
  return dayjs(date).subtract(months, 'month').toDate();
};

export const getMonthYear = (date = new Date()) => {
  const d = dayjs(date);
  return { year: d.year(), month: d.month() + 1 };
};

export const getDateRangeForMonth = (year, month) => {
  const start = dayjs().year(year).month(month - 1).startOf('month').toDate();
  const end = dayjs().year(year).month(month - 1).endOf('month').toDate();
  return { start, end };
};

export const getLastNMonths = (n = 12) => {
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'month');
    months.push({
      year: date.year(),
      month: date.month() + 1,
      label: date.format('MMM YYYY'),
      key: date.format('YYYY-MM')
    });
  }
  return months;
};

export const isValidDate = (date) => {
  return dayjs(date).isValid();
};

export const parseDate = (dateString) => {
  return dayjs(dateString).toDate();
};