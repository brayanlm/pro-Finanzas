import { body, query, param } from 'express-validator';
import { Types } from 'mongoose';

const isValidObjectId = (value) => Types.ObjectId.isValid(value);

export const createBudgetValidators = [
  body('categoryId').custom(isValidObjectId).withMessage('ID de categoría inválido'),
  body('year').isInt({ min: 2020, max: 2050 }).withMessage('Año inválido').toInt(),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Mes inválido (1-12)').toInt(),
  body('amount').isFloat({ min: 0.01, max: 1000000 }).withMessage('Presupuesto debe ser > 0').toFloat(),
  body('alertThresholds.warning').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('alertThresholds.danger').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('alertThresholds.critical').optional().isInt({ min: 1, max: 100 }).toInt()
];

export const updateBudgetValidators = [
  param('id').custom(isValidObjectId).withMessage('ID de presupuesto inválido'),
  body('amount').optional().isFloat({ min: 0.01, max: 1000000 }).toFloat(),
  body('alertThresholds.warning').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('alertThresholds.danger').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('alertThresholds.critical').optional().isInt({ min: 1, max: 100 }).toInt()
];

export const budgetIdValidator = [
  param('id').custom(isValidObjectId).withMessage('ID de presupuesto inválido')
];

export const listBudgetsValidators = [
  query('year').optional().isInt({ min: 2020, max: 2050 }).toInt(),
  query('month').optional().isInt({ min: 1, max: 12 }).toInt()
];