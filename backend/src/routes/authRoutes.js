import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  changePasswordValidators,
  updateProfileValidators
} from '../validators/authValidators.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', registerValidators, validate, register);
router.post('/login', loginValidators, validate, login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPasswordValidators, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidators, validate, resetPassword);

router.get('/me', authenticate, me);
router.put('/me', authenticate, updateProfileValidators, validate, updateProfile);
router.put('/me/password', authenticate, changePasswordValidators, validate, changePassword);

export default router;