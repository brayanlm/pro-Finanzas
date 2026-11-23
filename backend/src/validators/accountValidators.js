import { body, query, param } from 'express-validator';
import { Types } from 'mongoose';

const isValidObjectId = (value) => Types.ObjectId.isValid(value);
const ACCOUNT_TYPES = ['cash', 'bank', 'savings', 'debit_card', 'credit_card', 'other'];

export const createAccountValidators = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Nombre requerido (1-100 caracteres)').escape(),
  body('type').isIn(ACCOUNT_TYPES).withMessage('Tipo de cuenta inválido'),
  body('initialBalance').optional().isFloat({ min: -1000000, max: 1000000 }).withMessage('Saldo inicial inválido').toFloat(),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Código moneda 3 caracteres').toUpperCase(),
  body('creditLimit').optional().isFloat({ min: 0 }).withMessage('Límite de crédito debe ser positivo').toFloat(),
  body('bankName').optional().trim().isLength({ max: 100 }).escape(),
  body('lastFourDigits').optional().matches(/^\d{4}$/).withMessage('Últimos 4 dígitos deben ser 4 números'),
  body('description').optional().trim().isLength({ max: 500 }).escape()
];

export const updateAccountValidators = [
  param('id').custom(isValidObjectId).withMessage('ID de cuenta inválido'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).escape(),
  body('type').optional().isIn(ACCOUNT_TYPES),
  body('initialBalance').optional().isFloat({ min: -1000000, max: 1000000 }).toFloat(),
  body('currency').optional().isLength({ min: 3, max: 3 }).toUpperCase(),
  body('creditLimit').optional().isFloat({ min: 0 }).toFloat(),
  body('bankName').optional().trim().isLength({ max: 100 }).escape(),
  body('lastFourDigits').optional().matches(/^\d{4}$/),
  body('description').optional().trim().isLength({ max: 500 }).escape(),
  body('isActive').optional().isBoolean()
];

export const accountIdValidator = [
  param('id').custom(isValidObjectId).withMessage('ID de cuenta inválido')
];

export const listAccountsValidators = [
  query('active').optional().isBoolean(),
  query('type').optional().isIn(ACCOUNT_TYPES)
];