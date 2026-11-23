import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

export const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
};

export const verifyPassword = async (plainPassword, hash) => {
  return bcrypt.compare(plainPassword, hash);
};

export const validatePasswordStrength = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Al menos una mayúscula');
  if (!/[a-z]/.test(password)) errors.push('Al menos una minúscula');
  if (!/[0-9]/.test(password)) errors.push('Al menos un número');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Al menos un símbolo');
  return { valid: errors.length === 0, errors };
};

export const generateRandomPassword = (length = 16) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};