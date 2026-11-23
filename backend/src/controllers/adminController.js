import { userRepository } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';

export const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, active } = req.query;
    const filters = {};
    if (search) filters.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role) filters.role = role;
    if (active !== undefined) filters.isActive = active === 'true';

    const users = await userRepository.model.find(filters)
      .select('-passwordHash -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await userRepository.model.countDocuments(filters);

    res.json({
      success: true,
      data: users,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.params.id);
    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await userRepository.updateById(req.params.id, updates);
    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const user = await userRepository.updateById(req.params.id, { isActive: false });
    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }
    res.json({ success: true, message: 'Usuario desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};

export const getSystemStats = async (req, res, next) => {
  try {
    const User = (await import('../models/User.js')).default;
    const Movement = (await import('../models/Movement.js')).default;

    const [totalUsers, activeUsers, totalMovements, movementsLast30Days] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Movement.countDocuments({ deletedAt: null }),
      Movement.countDocuments({
        deletedAt: null,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalMovements,
        movementsLast30Days
      }
    });
  } catch (error) {
    next(error);
  }
};