export const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Efectivo', icon: 'banknote' },
  { value: 'bank', label: 'Cuenta bancaria', icon: 'building-2' },
  { value: 'savings', label: 'Cuenta de ahorros', icon: 'piggy-bank' },
  { value: 'debit_card', label: 'Tarjeta de débito', icon: 'credit-card' },
  { value: 'credit_card', label: 'Tarjeta de crédito', icon: 'credit-card' },
  { value: 'other', label: 'Otro', icon: 'wallet' }
];

export const CATEGORY_TYPES = [
  { value: 'income', label: 'Ingreso' },
  { value: 'expense', label: 'Gasto' }
];

export const MOVEMENT_TYPES = [
  { value: 'income', label: 'Ingreso', color: 'income' },
  { value: 'expense', label: 'Gasto', color: 'expense' }
];

export const CHART_PERIODS = [
  { value: '1m', label: '1 mes' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '12m', label: '12 meses' },
  { value: '24m', label: '24 meses' }
];

export const SORT_OPTIONS = [
  { value: '-date', label: 'Fecha (más reciente)' },
  { value: 'date', label: 'Fecha (más antigua)' },
  { value: '-amount', label: 'Importe (mayor a menor)' },
  { value: 'amount', label: 'Importe (menor a mayor)' },
  { value: '-createdAt', label: 'Creado (más reciente)' }
];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm',
  MONTH_YEAR: 'MM/YYYY'
};

export const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' }
];

export const THEME_OPTIONS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' }
];

export const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' }
];

export const ALERT_THRESHOLDS = {
  warning: 80,
  danger: 90,
  critical: 100
};

export const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' }
];

export const ICONS = [
  'utensils', 'car', 'home', 'zap', 'gamepad-2', 'heart-pulse', 'graduation-cap',
  'briefcase', 'laptop', 'trending-up', 'plus-circle', 'shopping-bag', 'gift',
  'plane', 'train', 'bus', 'bike', 'fuel', 'parking-ticket', 'ticket',
  'film', 'music', 'tv', 'headphones', 'camera', 'book-open', 'pen-tool',
  'code', 'terminal', 'server', 'database', 'hard-drive', 'cpu', 'monitor',
  'smartphone', 'tablet', 'watch', 'printer', 'scanner', 'router', 'wifi',
  'bluetooth', 'usb', 'plug', 'battery', 'bolt', 'sun', 'moon', 'cloud',
  'droplet', 'wind', 'snowflake', 'thermometer', 'umbrella', 'compass',
  'map-pin', 'navigation', 'anchor', 'ship', 'truck', 'van', 'bicycle',
  'motorcycle', 'helicopter', 'rocket', 'satellite', 'globe', 'earth',
  'mountain', 'tree', 'flower', 'leaf', 'seedling', 'spa', 'massage',
  'dumbbell', 'activity', 'heart', 'stethoscope', 'pill', 'syringe',
  'bandage', 'dna', 'microscope', 'telescope', 'atom', 'flask-conical',
  'test-tube', 'petri-dish', 'magnet', 'bug', 'mouse', 'keyboard'
];