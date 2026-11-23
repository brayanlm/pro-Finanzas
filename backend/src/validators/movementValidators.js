import { body, query, param } from 'express-validator';
import { Types } from 'mongoose';

const isValidObjectId = (value) => Types.ObjectId.isValid(value);

export const createMovementValidators = [
  body('type').isIn(['income', 'expense']).withMessage('Tipo debe ser income o expense'),
  body('description').trim().isLength({ min: 1, max: 200 }).withMessage('Descripción requerida (1-200 caracteres)').escape(),
  body('amount').isFloat({ gt: 0, max: 1000000 }).withMessage('Importe debe ser > 0').toFloat(),
  body('categoryId').custom(isValidObjectId).withMessage('ID de categoría inválido'),
  body('accountId').custom(isValidObjectId).withMessage('ID de cuenta inválido'),
  body('date').isISO8601().withMessage('Fecha inválida').toDate(),
  body('notes').optional().trim().isLength({ max: 1000 }).escape()
];

export const updateMovementValidators = [
  param('id').custom(isValidObjectId).withMessage('ID de movimiento inválido'),
  body('description').optional().trim().isLength({ min: 1, max: 200 }).escape(),
  body('amount').optional().isFloat({ gt: 0, max: 1000000 }).toFloat(),
  body('categoryId').optional().custom(isValidObjectId).withMessage('ID de categoría inválido'),
  body('accountId').optional().custom(isValidObjectId).withMessage('ID de cuenta inválido'),
  body('date').optional().isISO8601().toDate(),
  body('notes').optional().trim().isLength({ max: 1000 }).escape()
];

export const movementIdValidator = [
  param('id').custom(isValidObjectId).withMessage('ID de movimiento inválido')
];

export const listMovementsValidators = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isIn(['date', '-date', 'amount', '-amount', 'createdAt', '-createdAt']),
  query('type').optional().isIn(['income', 'expense']),
  query('categoryId').optional().custom(isValidObjectId),
  query('accountId').optional().custom(isValidObjectId),
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
  query('search').optional().trim().isLength({ max: 100 }).escape()
];

export const summaryValidators = [
  query('year').optional().isInt({ min: 2020, max: 2050 }).toInt(),
  query('month').optional().isInt({ min: 1, max: 12 }).toInt()
];