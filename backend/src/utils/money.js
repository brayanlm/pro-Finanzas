// Utilidades de precisión monetaria.
// Evitamos errores de punto flotante binario redondeando a la unidad mínima (céntimos).
// NOTA: el almacenamiento sigue usando Number; para garantías absolutas se recomienda
// migrar a enteros en céntimos o mongoose.Decimal128. Ver README.

export const MONEY_SCALE = 100;
export const MONEY_EPSILON = 1e-9;

export const isValidMoney = (value) => {
  if (typeof value === 'string') {
    if (value.trim() === '') return false;
    const n = Number(value);
    return Number.isFinite(n);
  }
  return typeof value === 'number' && Number.isFinite(value);
};

export const isPositiveMoney = (value) => isValidMoney(value) && Number(value) > 0;

export const isNonNegativeMoney = (value) => isValidMoney(value) && Number(value) >= 0;

// Redondeo a 2 decimales evitando el error típico de `Math.round(x*100)/100`.
export const roundMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new TypeError(`Importe no numérico: ${value}`);
  }
  // Truco clásico con notación exponencial para corregir representación binaria.
  return Number(Math.round(Number(`${n}e${2}`)) + `e-2`);
};

// Convierte a entero en céntimos (base para cálculos exactos).
export const toCents = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new TypeError(`Importe no numérico: ${value}`);
  return Math.round(roundMoney(n) * MONEY_SCALE);
};

// Convierte céntimos enteros de vuelta a unidad monetaria.
export const fromCents = (cents) => {
  if (!Number.isInteger(cents)) throw new TypeError(`Céntimos no enteros: ${cents}`);
  return cents / MONEY_SCALE;
};

// Suma precisa de importes.
export const sumMoney = (values) => {
  const cents = (values || []).reduce((acc, v) => acc + toCents(v || 0), 0);
  return fromCents(cents);
};

export const addMoney = (a, b) => fromCents(toCents(a) + toCents(b));
export const subtractMoney = (a, b) => fromCents(toCents(a) - toCents(b));
