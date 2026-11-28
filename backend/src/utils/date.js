import dayjs from 'dayjs';

const pad = (n, len = 2) => String(n).padStart(len, '0');

// Formato determinista en UTC (independiente de la zona horaria local),
// evitando desfases de un día. Soporta tokens DD MM YYYY YY HH mm ss.
const formatUtc = (date, format) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const map = {
    YYYY: String(d.getUTCFullYear()),
    YY: pad(d.getUTCFullYear() % 100),
    MM: pad(d.getUTCMonth() + 1),
    DD: pad(d.getUTCDate()),
    HH: pad(d.getUTCHours()),
    mm: pad(d.getUTCMinutes()),
    ss: pad(d.getUTCSeconds())
  };
  return String(format).replace(/YYYY|YY|MM|DD|HH|mm|ss/g, (token) => map[token] ?? token);
};

export const formatDate = (date, format = 'DD/MM/YYYY') => formatUtc(date, format);

export const formatDateTime = (date, format = 'DD/MM/YYYY HH:mm') => formatUtc(date, format);

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
  if (date === null || date === undefined || date === '') return false;
  if (date instanceof Date) return !Number.isNaN(date.getTime());
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  // Para cadenas ISO de fecha (YYYY-MM-DD) validar rangos reales (mes/día).
  if (typeof date === 'string') {
    const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [, y, mo, da] = m;
      const year = Number(y);
      const month = Number(mo);
      const day = Number(da);
      if (month < 1 || month > 12 || day < 1 || day > 31) return false;
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      if (day > daysInMonth) return false;
    }
  }
  return true;
};

export const parseDate = (dateString) => {
  return dayjs(dateString).toDate();
};