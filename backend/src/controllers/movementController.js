import mongoose from 'mongoose';
import { movementRepository } from '../repositories/index.js';
import { categoryRepository } from '../repositories/index.js';
import { accountRepository } from '../repositories/index.js';
import { budgetRepository } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';

export const listMovements = async (req, res, next) => {
  try {
    const { page, limit, sort, type, categoryId, accountId, startDate, endDate, search } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (categoryId) filters.categoryId = categoryId;
    if (accountId) filters.accountId = accountId;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }
    if (search) {
      filters.description = { $regex: search, $options: 'i' };
    }

    const sortObj = sort ? { [sort.startsWith('-') ? sort.slice(1) : sort]: sort.startsWith('-') ? -1 : 1 } : { date: -1, createdAt: -1 };

    const result = await movementRepository.paginate(filters, parseInt(page) || 1, parseInt(limit) || 20, { sort: sortObj });

    const movementsWithPopulate = await Promise.all(
      result.data.map(async (m) => {
        const [category, account] = await Promise.all([
          categoryRepository.findById(m.categoryId),
          accountRepository.findById(m.accountId)
        ]);
        return {
          ...m,
          category: category ? { id: category._id, name: category.name, color: category.color, icon: category.icon } : null,
          account: account ? { id: account._id, name: account.name, type: account.type } : null
        };
      })
    );

    res.json({ success: true, data: movementsWithPopulate, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

export const getMovement = async (req, res, next) => {
  try {
    const movement = await movementRepository.findByIdAndUserWithPopulate(req.params.id, req.user.id);
    if (!movement) {
      throw AppError.notFound('Movimiento no encontrado');
    }
    res.json({ success: true, data: movement });
  } catch (error) {
    next(error);
  }
};

export const createMovement = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { type, description, amount, categoryId, accountId, date, notes } = req.body;

    const [category, account] = await Promise.all([
      categoryRepository.findById(categoryId),
      accountRepository.findById(accountId)
    ]);

    if (!category || category.userId.toString() !== req.user.id) {
      throw AppError.notFound('Categoría no encontrada');
    }
    if (!account || account.userId.toString() !== req.user.id) {
      throw AppError.notFound('Cuenta no encontrada');
    }
    if (category.type !== type) {
      throw AppError.unprocessable('El tipo de categoría no coincide con el tipo de movimiento', { field: 'categoryId' });
    }

    const movement = await movementRepository.create({
      userId: req.user.id,
      type,
      description,
      amount,
      categoryId,
      accountId,
      date: new Date(date),
      notes
    }, session);

    const amountChange = type === 'income' ? amount : -amount;
    account.currentBalance += amountChange;
    await account.save({ session });

    if (type === 'expense') {
      const movementDate = new Date(date);
      const year = movementDate.getFullYear();
      const month = movementDate.getMonth() + 1;
      const budget = await budgetRepository.upsert(req.user.id, categoryId, year, month, { $inc: { spent: amount } });
    }

    await session.commitTransaction();

    const populatedMovement = await movementRepository.findByIdAndUserWithPopulate(movement._id, req.user.id);
    res.status(201).json({ success: true, data: populatedMovement });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const updateMovement = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { description, amount, categoryId, accountId, date, notes } = req.body;

    const movement = await movementRepository.findByIdAndUser(req.params.id, req.user.id);
    if (!movement) {
      throw AppError.notFound('Movimiento no encontrado');
    }

    const oldAmount = movement.amount;
    const oldType = movement.type;
    const oldCategoryId = movement.categoryId.toString();
    const oldAccountId = movement.accountId.toString();
    const oldDate = movement.date;

    const newType = type || oldType;
    const newAmount = amount !== undefined ? amount : oldAmount;
    const newCategoryId = categoryId || oldCategoryId;
    const newAccountId = accountId || oldAccountId;
    const newDate = date ? new Date(date) : oldDate;

    if (categoryId && categoryId !== oldCategoryId) {
      const category = await categoryRepository.findById(categoryId);
      if (!category || category.userId.toString() !== req.user.id) {
        throw AppError.notFound('Categoría no encontrada');
      }
      if (category.type !== newType) {
        throw AppError.unprocessable('El tipo de categoría no coincide con el tipo de movimiento', { field: 'categoryId' });
      }
    }

    if (accountId && accountId !== oldAccountId) {
      const account = await accountRepository.findById(accountId);
      if (!account || account.userId.toString() !== req.user.id) {
        throw AppError.notFound('Cuenta no encontrada');
      }
    }

    const updates = {};
    if (description) updates.description = description;
    if (amount !== undefined) updates.amount = amount;
    if (categoryId) updates.categoryId = categoryId;
    if (accountId) updates.accountId = accountId;
    if (date) updates.date = new Date(date);
    if (notes !== undefined) updates.notes = notes;

    const updatedMovement = await movementRepository.updateById(req.params.id, updates, { session });

    if (oldAccountId !== newAccountId || oldAmount !== newAmount || oldType !== newType) {
      const oldAmountChange = oldType === 'income' ? oldAmount : -oldAmount;
      const oldAccount = await accountRepository.findById(oldAccountId);
      oldAccount.currentBalance -= oldAmountChange;
      await oldAccount.save({ session });

      const newAmountChange = newType === 'income' ? newAmount : -newAmount;
      const newAccount = await accountRepository.findById(newAccountId);
      newAccount.currentBalance += newAmountChange;
      await newAccount.save({ session });
    } else if (oldAmount !== newAmount) {
      const amountDiff = newAmount - oldAmount;
      const amountChange = oldType === 'income' ? amountDiff : -amountDiff;
      const account = await accountRepository.findById(oldAccountId);
      account.currentBalance += amountChange;
      await account.save({ session });
    }

    if (oldType === 'expense') {
      const oldMovementDate = new Date(oldDate);
      const oldYear = oldMovementDate.getFullYear();
      const oldMonth = oldMovementDate.getMonth() + 1;
      await budgetRepository.findByIdAndUpdate(
        { userId: req.user.id, categoryId: oldCategoryId, year: oldYear, month: oldMonth },
        { $inc: { spent: -oldAmount } },
        { session }
      );
    }

    if (newType === 'expense') {
      const newMovementDate = new Date(newDate);
      const newYear = newMovementDate.getFullYear();
      const newMonth = newMovementDate.getMonth() + 1;
      await budgetRepository.upsert(req.user.id, newCategoryId, newYear, newMonth, { $inc: { spent: newAmount } });
    }

    await session.commitTransaction();

    const populatedMovement = await movementRepository.findByIdAndUserWithPopulate(updatedMovement._id, req.user.id);
    res.json({ success: true, data: populatedMovement });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const deleteMovement = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const movement = await movementRepository.findByIdAndUser(req.params.id, req.user.id);
    if (!movement) {
      throw AppError.notFound('Movimiento no encontrado');
    }

    await movementRepository.softDeleteById(req.params.id, session);

    const amountChange = movement.type === 'income' ? -movement.amount : movement.amount;
    const account = await accountRepository.findById(movement.accountId);
    account.currentBalance += amountChange;
    await account.save({ session });

    if (movement.type === 'expense') {
      const movementDate = new Date(movement.date);
      const year = movementDate.getFullYear();
      const month = movementDate.getMonth() + 1;
      await budgetRepository.findByIdAndUpdate(
        { userId: req.user.id, categoryId: movement.categoryId, year, month },
        { $inc: { spent: -movement.amount } },
        { session }
      );
    }

    await session.commitTransaction();
    res.json({ success: true, message: 'Movimiento eliminado correctamente' });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth() + 1;

    const [current, previous] = await Promise.all([
      movementRepository.getMonthlySummary(req.user.id, currentYear, currentMonth),
      movementRepository.getMonthlySummary(req.user.id, prevYear, prevMonth)
    ]);

    const currentIncome = current.find(c => c.type === 'income')?.total || 0;
    const currentExpense = current.find(c => c.type === 'expense')?.total || 0;
    const previousIncome = previous.find(c => c.type === 'income')?.total || 0;
    const previousExpense = previous.find(c => c.type === 'expense')?.total || 0;

    const balance = currentIncome - currentExpense;
    const expensePercentage = currentIncome > 0 ? ((currentExpense / currentIncome) * 100) : 0;

    res.json({
      success: true,
      data: {
        income: { total: currentIncome, count: current.find(c => c.type === 'income')?.count || 0 },
        expense: { total: currentExpense, count: current.find(c => c.type === 'expense')?.count || 0 },
        balance,
        expensePercentage: Math.round(expensePercentage * 100) / 100,
        previousMonth: {
          income: previousIncome,
          expense: previousExpense,
          balance: previousIncome - previousExpense
        },
        variation: {
          incomePct: previousIncome > 0 ? Math.round(((currentIncome - previousIncome) / previousIncome) * 10000) / 100 : (currentIncome > 0 ? 100 : 0),
          expensePct: previousExpense > 0 ? Math.round(((currentExpense - previousExpense) / previousExpense) * 10000) / 100 : (currentExpense > 0 ? 100 : 0),
          balancePct: (previousIncome - previousExpense) !== 0 ? Math.round(((balance - (previousIncome - previousExpense)) / Math.abs(previousIncome - previousExpense)) * 10000) / 100 : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};