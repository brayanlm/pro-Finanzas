import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.sub).select('-passwordHash -emailVerificationToken -passwordResetToken');
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Usuario no encontrado o inactivo');
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(AppError.unauthorized('Token inválido'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Token expirado', 'TOKEN_EXPIRED'));
    }
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.sub).select('-passwordHash -emailVerificationToken -passwordResetToken');
    if (user && user.isActive) {
      req.user = user;
      req.tokenPayload = decoded;
    }
    next();
  } catch {
    next();
  }
};