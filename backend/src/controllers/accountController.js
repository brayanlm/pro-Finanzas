import { accountRepository } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';

export const listAccounts = async (req, res, next) => {
  try {
    const { type, active } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (active !== undefined) filters.isActive = active === 'true';

    const accounts = await accountRepository.findByUser(req.user.id, filters);
    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
};

export const getAccount = async (req, res, next) => {
  try {
    const { includeMovements, limit } = req.query;
    const account = await accountRepository.findByIdAndUser(req.params.id, req.user.id);
    if (!account) {
      throw AppError.notFound('Cuenta no encontrada');
    }

    if (includeMovements === 'true') {
      const Movement = (await import('../models/Movement.js')).default;
      const movements = await Movement.find({ accountId: account._id, deletedAt: null })
        .sort({ date: -1 })
        .limit(parseInt(limit) || 10)
        .populate('category', 'name type color icon')
        .lean();
      account.recentMovements = movements;
    }

    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
};

export const createAccount = async (req, res, next) => {
  try {
    const { name, type, initialBalance, currency, creditLimit, bankName, lastFourDigits, description } = req.body;

    const exists = await accountRepository.existsByName(req.user.id, name);
    if (exists) {
      throw AppError.conflict('Ya existe una cuenta con ese nombre', { field: 'name' });
    }

    const account = await accountRepository.create({
      userId: req.user.id,
      name,
      type,
      initialBalance: initialBalance || 0,
      currentBalance: initialBalance || 0,
      currency: currency || 'EUR',
      creditLimit,
      bankName,
      lastFourDigits,
      description
    });

    res.status(201).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
};

export const updateAccount = async (req, res, next) => {
  try {
    const { name, type, initialBalance, currency, creditLimit, bankName, lastFourDigits, description, isActive } = req.body;

    const account = await accountRepository.findByIdAndUser(req.params.id, req.user.id);
    if (!account) {
      throw AppError.notFound('Cuenta no encontrada');
    }

    if (name && name !== account.name) {
      const exists = await accountRepository.existsByName(req.user.id, name, req.params.id);
      if (exists) {
        throw AppError.conflict('Ya existe una cuenta con ese nombre', { field: 'name' });
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (type) updates.type = type;
    if (initialBalance !== undefined) {
      updates.initialBalance = initialBalance;
      const diff = initialBalance - account.initialBalance;
      updates.currentBalance = account.currentBalance + diff;
    }
    if (currency) updates.currency = currency;
    if (creditLimit !== undefined) updates.creditLimit = creditLimit;
    if (bankName !== undefined) updates.bankName = bankName;
    if (lastFourDigits !== undefined) updates.lastFourDigits = lastFourDigits;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await accountRepository.updateById(req.params.id, updates);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const account = await accountRepository.findByIdAndUser(req.params.id, req.user.id);
    if (!account) {
      throw AppError.notFound('Cuenta no encontrada');
    }

    const Movement = (await import('../models/Movement.js')).default;
    const count = await Movement.countDocuments({ accountId: account._id, deletedAt: null });
    if (count > 0) {
      throw AppError.conflict('No se puede eliminar: tiene movimientos asociados', { movementCount: count });
    }

    await accountRepository.softDeleteById(req.params.id);
    res.json({ success: true, message: 'Cuenta eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

export const recalculateBalance = async (req, res, next) => {
  try {
    const account = await accountRepository.findByIdAndUser(req.params.id, req.user.id);
    if (!account) {
      throw AppError.notFound('Cuenta no encontrada');
    }

    const balance = await account.recalculateBalance();
    res.json({ success: true, data: { currentBalance: balance } });
  } catch (error) {
    next(error);
  }
};