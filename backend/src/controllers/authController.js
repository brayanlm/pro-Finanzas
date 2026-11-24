import { userRepository } from '../repositories/index.js';
import Category from '../models/Category.js';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password.js';
import { generateAccessToken, generateResetToken } from '../utils/jwt.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { AppError } from '../utils/AppError.js';
import crypto from 'crypto';

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw AppError.conflict('El email ya está registrado', { field: 'email' });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw AppError.unprocessable('Contraseña no cumple requisitos', passwordValidation.errors.map(e => ({ field: 'password', message: e })));
    }

    const passwordHash = await hashPassword(password);

    const user = await userRepository.create({
      email,
      passwordHash,
      name,
      role: 'USER',
      isActive: true,
      emailVerified: false
    });

    const defaults = Category.getDefaultCategories();
    const docs = defaults.map(c => ({ ...c, userId: user._id, isDefault: true }));
    await Category.insertMany(docs, { ordered: false });

    const token = generateAccessToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: user.toPublicJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw AppError.unauthorized('Cuenta desactivada');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    await userRepository.updateLastLogin(user._id);

    const token = generateAccessToken(user);

    const { passwordHash: _passwordHash, emailVerificationToken: _emailVerificationToken, passwordResetToken: _passwordResetToken, ...userData } = user;

    res.json({
      success: true,
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Sesión cerrada correctamente' });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, preferences } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

    const user = await userRepository.updateById(req.user.id, updates);
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await userRepository.findByEmailWithPassword(req.user.email);
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Contraseña actual incorrecta');
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw AppError.unprocessable('Nueva contraseña no cumple requisitos', passwordValidation.errors.map(e => ({ field: 'newPassword', message: e })));
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updateById(req.user.id, { passwordHash });

    res.json({ success: true, message: 'Contraseña cambiada correctamente' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      return res.json({ success: true, message: 'Si el email existe, recibirás instrucciones' });
    }

    const resetToken = generateResetToken();
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await userRepository.setPasswordResetToken(user._id, tokenHash, expires);
    await sendPasswordResetEmail(user.email, resetToken, user.name);

    res.json({ success: true, message: 'Si el email existe, recibirás instrucciones' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userRepository.findByResetToken(tokenHash);
    if (!user) {
      throw AppError.unauthorized('Token inválido o expirado', 'TOKEN_EXPIRED');
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw AppError.unprocessable('Contraseña no cumple requisitos', passwordValidation.errors.map(e => ({ field: 'password', message: e })));
    }

    const passwordHash = await hashPassword(password);
    await userRepository.updateById(user._id, { passwordHash });
    await userRepository.clearPasswordResetToken(user._id);

    res.json({ success: true, message: 'Contraseña actualizada. Inicia sesión con la nueva.' });
  } catch (error) {
    next(error);
  }
};