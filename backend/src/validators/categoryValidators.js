import { body, query, param } from 'express-validator';
import { Types } from 'mongoose';

const isValidObjectId = (value) => Types.ObjectId.isValid(value);

export const createCategoryValidators = [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Nombre requerido (1-50 caracteres)').escape(),
  body('type').isIn(['income', 'expense']).withMessage('Tipo debe ser income o expense'),
  body('color').matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color debe ser hexadecimal (#RRGGBB)'),
  body('icon').trim().isLength({ min: 1, max: 50 }).withMessage('Icono requerido').escape(),
  body('isDefault').optional().isBoolean()
];

export const updateCategoryValidators = [
  param('id').custom(isValidObjectId).withMessage('ID de categoría inválido'),
  body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Nombre 1-50 caracteres').escape(),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color hexadecimal'),
  body('icon').optional().trim().isLength({ min: 1, max: 50 }).escape(),
  body('isActive').optional().isBoolean(),
  body('sortOrder').optional().isInt({ min: 0 })
];

export const categoryIdValidator = [
  param('id').custom(isValidObjectId).withMessage('ID de categoría inválido')
];

export const listCategoriesValidators = [
  query('type').optional().isIn(['income', 'expense']),
  query('active').optional().isBoolean()
];