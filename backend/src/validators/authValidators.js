import { body, query, param } from 'express-validator';
import { Types } from 'mongoose';

const isValidObjectId = (value) => Types.ObjectId.isValid(value);

export const registerValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres')
    .matches(/[A-Z]/).withMessage('Al menos una mayúscula')
    .matches(/[a-z]/).withMessage('Al menos una minúscula')
    .matches(/[0-9]/).withMessage('Al menos un número')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/).withMessage('Al menos un símbolo'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Las contraseñas no coinciden'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Nombre requerido (1-100 caracteres)').escape()
];

export const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
  body('rememberMe').optional().isBoolean()
];

export const forgotPasswordValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido')
];

export const resetPasswordValidators = [
  body('token').isLength({ min: 64, max: 64 }).withMessage('Token inválido'),
  body('password').isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres')
    .matches(/[A-Z]/).withMessage('Al menos una mayúscula')
    .matches(/[a-z]/).withMessage('Al menos una minúscula')
    .matches(/[0-9]/).withMessage('Al menos un número')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/).withMessage('Al menos un símbolo'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Las contraseñas no coinciden')
];

export const changePasswordValidators = [
  body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
  body('newPassword').isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres')
    .matches(/[A-Z]/).withMessage('Al menos una mayúscula')
    .matches(/[a-z]/).withMessage('Al menos una minúscula')
    .matches(/[0-9]/).withMessage('Al menos un número')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/).withMessage('Al menos un símbolo'),
  body('confirmPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Las contraseñas no coinciden')
];

export const updateProfileValidators = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Nombre 1-100 caracteres').escape(),
  body('preferences.currency').optional().isLength({ min: 3, max: 3 }).withMessage('Código moneda 3 caracteres'),
  body('preferences.dateFormat').optional().isString(),
  body('preferences.theme').optional().isIn(['light', 'dark', 'system']),
  body('preferences.language').optional().isLength({ min: 2, max: 5 })
];