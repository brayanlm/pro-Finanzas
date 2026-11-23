import { query } from 'express-validator';
import { Types } from 'mongoose';

const isValidObjectId = (value) => Types.ObjectId.isValid(value);

export const exportReportValidators = [
  query('format').isIn(['pdf', 'excel']).withMessage('Formato debe ser pdf o excel'),
  query('year').optional().isInt({ min: 2020, max: 2050 }).toInt(),
  query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
  query('type').optional().isIn(['income', 'expense', 'all']),
  query('categoryId').optional().custom(isValidObjectId),
  query('accountId').optional().custom(isValidObjectId),
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate()
];