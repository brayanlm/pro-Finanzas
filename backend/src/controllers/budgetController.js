import { budgetRepository } from '../repositories/index.js';
import { categoryRepository } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';

export const listBudgets = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const budgets = await budgetRepository.getWithCategory(req.user.id, currentYear, currentMonth);
    res.json({ success: true, data: budgets });
  } catch (error) {
    next(error);
  }
};

export const getBudget = async (req, res, next) => {
  try {
    const budget = await budgetRepository.findByIdAndUser(req.params.id, req.user.id);
    if (!budget) {
      throw AppError.notFound('Presupuesto no encontrado');
    }
    res.json({ success: true, data: budget });
  } catch (error) {
    next(error);
  }
};

export const upsertBudget = async (req, res, next) => {
  try {
    const { categoryId, year, month, amount, alertThresholds } = req.body;

    const category = await categoryRepository.findById(categoryId);
    if (!category || category.userId.toString() !== req.user.id) {
      throw AppError.notFound('Categoría no encontrada');
    }
    if (category.type !== 'expense') {
      throw AppError.unprocessable('Los presupuestos solo se pueden crear para categorías de gasto');
    }

    const budget = await budgetRepository.upsert(req.user.id, categoryId, year, month, { amount, alertThresholds });
    res.json({ success: true, data: budget });
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (req, res, next) => {
  try {
    const { amount, alertThresholds } = req.body;

    const budget = await budgetRepository.findByIdAndUser(req.params.id, req.user.id);
    if (!budget) {
      throw AppError.notFound('Presupuesto no encontrado');
    }

    const updates = {};
    if (amount !== undefined) updates.amount = amount;
    if (alertThresholds) updates.alertThresholds = { ...budget.alertThresholds, ...alertThresholds };

    const updated = await budgetRepository.updateById(req.params.id, updates);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const budget = await budgetRepository.findByIdAndUser(req.params.id, req.user.id);
    if (!budget) {
      throw AppError.notFound('Presupuesto no encontrado');
    }

    await budgetRepository.deleteById(req.params.id);
    res.json({ success: true, message: 'Presupuesto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

export const getBudgetSummary = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const summary = await budgetRepository.getSummary(req.user.id, currentYear, currentMonth);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};