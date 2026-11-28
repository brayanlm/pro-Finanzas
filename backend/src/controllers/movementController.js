import mongoose from 'mongoose';
import { movementRepository, categoryRepository, accountRepository, budgetRepository } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';
import { roundMoney, isPositiveMoney, MONEY_EPSILON } from '../utils/money.js';
import Movement from '../models/Movement.js';
import Account from '../models/Account.js';

const escapeRegExp = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const recomputeBudgetSpent = async (userId, categoryId, date, session) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  // Asegura que exista un presupuesto (sin inventar monto) y recalcula `spent` desde movimientos.
  const budget = await budgetRepository.upsert(userId, categoryId, year, month, {}, session);
  if (budget?._id) {
    const { default: Budget } = await import('../models/Budget.js');
    await Budget.recalculateSpent(budget._id, session);
  }
};

const recomputeAccountBalance = async (accountId, userId, session) => {
  const account = await Account.findOne({ _id: accountId, userId, deletedAt: null }).session(session);
  if (account) {
    await account.recalculateBalance(session);
  }
};

const findOwnedAccount = async (accountId, userId, session) => {
  const account = await Account.findOne({ _id: accountId, userId, deletedAt: null }).session(session);
  if (!account) throw AppError.notFound('Cuenta no encontrada');
  return account;
};

const findOwnedCategory = async (categoryId, userId, session) => {
  const category = await mongoose.model('Category').findOne({ _id: categoryId, userId }).session(session).lean();
  if (!category) throw AppError.notFound('Categoría no encontrada');
  return category;
};

// Saldo disponible para una cuenta (incluye límite de crédito en tarjetas de crédito).
const availableBalanceFor = (account) => {
  const base = roundMoney(account.currentBalance || 0);
  if (account.type === 'credit_card') return roundMoney(base + roundMoney(account.creditLimit || 0));
  return base;
};

// No se permiten retiros (expense) superiores al saldo disponible.
const assertSufficientFunds = (account, type, cleanAmount) => {
  if (type !== 'expense') return;
  const available = availableBalanceFor(account);
  if (cleanAmount > available + MONEY_EPSILON) {
    throw new AppError(
      'Saldo insuficiente para realizar este retiro',
      422,
      'INSUFFICIENT_FUNDS',
      { field: 'amount', availableBalance: available, requestedAmount: cleanAmount, accountId: account._id?.toString() }
    );
  }
};

export const listMovements = async (req, res, next) => {
  try {
    const query = req.sanitizedQuery || req.query;
    const { page, limit, sort, type, categoryId, accountId, startDate, endDate, search } = query;

    const filters = { userId: req.user.id };
    if (type) filters.type = type;
    if (categoryId) filters.categoryId = categoryId;
    if (accountId) filters.accountId = accountId;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }
    if (search) {
      // `$regex` con input escapado + límite; evita ReDoS e inyección.
      filters.description = { $regex: escapeRegExp(search), $options: 'i' };
    }

    const allowedSort = new Set(['date', 'amount', 'createdAt']);
    let sortObj = { date: -1, createdAt: -1 };
    if (sort && typeof sort === 'string') {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      if (allowedSort.has(field)) sortObj = { [field]: desc ? -1 : 1 };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const result = await movementRepository.paginate(filters, pageNum, limitNum, { sort: sortObj });

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
  const userId = req.user.id;
  const idempotencyKey = typeof req.body.idempotencyKey === 'string' ? req.body.idempotencyKey.trim() : undefined;
  try {
    const { type, description, amount, categoryId, accountId, date, notes } = req.body;

    if (type !== 'income' && type !== 'expense') throw AppError.badRequest('Tipo debe ser income o expense');
    if (!isPositiveMoney(amount)) throw AppError.unprocessable('El importe debe ser un número válido mayor a 0', { field: 'amount' });
    const cleanAmount = roundMoney(Number(amount));

    const movementDate = new Date(date);
    if (Number.isNaN(movementDate.getTime())) throw AppError.badRequest('Fecha inválida', { field: 'date' });

    // Anti-duplicado (fast-path): si ya existe un movimiento con esta clave, devolverlo.
    if (idempotencyKey) {
      const existing = await Movement.findOne({ userId, idempotencyKey, deletedAt: null }).lean();
      if (existing) {
        return res.status(200).json({ success: true, data: existing, idempotent: true });
      }
    }

    let movement;

    // `withTransaction` garantiza atomicidad y reintentos controlados SOLO ante
    // errores transitorios (`TransientTransactionError` / `UnknownTransactionCommitResult`).
    // Todas las operaciones usan la MISMA `session`. No se capturan errores para ocultarlos.
    await session.withTransaction(async () => {
      // Re-verificar idempotencia DENTRO de la transacción (evita condiciones de carrera).
      if (idempotencyKey) {
        const duplicate = await Movement.findOne({ userId, idempotencyKey, deletedAt: null }).session(session).lean();
        if (duplicate) { movement = duplicate; return; }
      }

      // Secuencial (NO `Promise.all` sobre la misma sesión dentro de una transacción).
      const category = await findOwnedCategory(categoryId, userId, session);
      const account = await findOwnedAccount(accountId, userId, session);

      if (category.type !== type) {
        throw AppError.unprocessable('El tipo de categoría no coincide con el tipo de movimiento', { field: 'categoryId' });
      }

      // No permitir retiros superiores al saldo disponible (lectura dentro de la transacción).
      assertSufficientFunds(account, type, cleanAmount);

      movement = await movementRepository.create({
        userId,
        type,
        description,
        amount: cleanAmount,
        categoryId,
        accountId,
        date: movementDate,
        notes,
        ...(idempotencyKey ? { idempotencyKey } : {})
      }, session);

      // Saldo recalculado desde cero (atómico en la transacción).
      await recomputeAccountBalance(account._id, userId, session);

      // Presupuesto `spent` recalculado (gastos), misma sesión.
      if (type === 'expense') {
        await recomputeBudgetSpent(userId, categoryId, movementDate, session);
      }
    });

    const populatedMovement = await movementRepository.findByIdAndUserWithPopulate(movement._id, userId);
    res.status(201).json({ success: true, data: populatedMovement });
  } catch (error) {
    // Conflicto de clave única de idempotencia en condición de carrera → devolver el existente.
    if (idempotencyKey && error?.code === 11000) {
      const existing = await Movement.findOne({ userId, idempotencyKey, deletedAt: null }).lean();
      if (existing) return res.status(200).json({ success: true, data: existing, idempotent: true });
    }
    next(error);
  } finally {
    await session.endSession();
  }
};

export const updateMovement = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user.id;
    const { description, amount, categoryId, accountId, date, notes, type } = req.body;

    session.startTransaction();

    const movement = await Movement.findOne({ _id: req.params.id, userId, deletedAt: null }).session(session);
    if (!movement) throw AppError.notFound('Movimiento no encontrado');

    const oldType = movement.type;
    const oldAmount = movement.amount;
    const oldCategoryId = movement.categoryId.toString();
    const oldAccountId = movement.accountId.toString();
    const oldDate = movement.date;

    const newType = type !== undefined ? type : oldType;
    if (newType !== 'income' && newType !== 'expense') throw AppError.badRequest('Tipo debe ser income o expense');

    let newAmount = oldAmount;
    if (amount !== undefined) {
      if (!isPositiveMoney(amount)) throw AppError.unprocessable('El importe debe ser un número válido mayor a 0', { field: 'amount' });
      newAmount = roundMoney(Number(amount));
    }

    const newCategoryId = categoryId || oldCategoryId;
    const newAccountId = accountId || oldAccountId;
    const newDate = date !== undefined ? new Date(date) : oldDate;
    if (date !== undefined && Number.isNaN(newDate.getTime())) throw AppError.badRequest('Fecha inválida', { field: 'date' });

    // Validar propiedad de categoría y cuenta (multi-tenant).
    const category = await findOwnedCategory(newCategoryId, userId, session);
    if (category.type !== newType) {
      throw AppError.unprocessable('El tipo de categoría no coincide con el tipo de movimiento', { field: 'categoryId' });
    }
    await findOwnedAccount(newAccountId, userId, session);
    if (newAccountId !== oldAccountId) await findOwnedAccount(oldAccountId, userId, session);

    if (description !== undefined) movement.description = description;
    if (amount !== undefined) movement.amount = newAmount;
    if (categoryId !== undefined) movement.categoryId = newCategoryId;
    if (accountId !== undefined) movement.accountId = newAccountId;
    if (date !== undefined) movement.date = newDate;
    if (notes !== undefined) movement.notes = notes;
    if (type !== undefined) movement.type = newType;

    await movement.save({ session });

    // Recalcular saldos de cuentas afectadas (old + new) y presupuestos `spent`.
    const accountsToRecompute = new Set([oldAccountId, newAccountId]);
    for (const accId of accountsToRecompute) {
      await recomputeAccountBalance(accId, userId, session);
    }

    // Revertir/aplicar presupuesto sobre categoría/mes antiguos y nuevos.
    const budgetTargets = new Set();
    if (oldType === 'expense') budgetTargets.add(`${oldCategoryId}|${oldDate.toISOString()}`);
    if (newType === 'expense') budgetTargets.add(`${newCategoryId}|${newDate.toISOString()}`);
    // Recalcular `spent` a partir de movimientos reales en lugar de $inc delta.
    const seenBudgetKeys = new Set();
    for (const key of budgetTargets) {
      const [catId, iso] = key.split('|');
      const d = new Date(iso);
      const bKey = `${catId}|${d.getFullYear()}|${d.getMonth() + 1}`;
      if (seenBudgetKeys.has(bKey)) continue;
      seenBudgetKeys.add(bKey);
      const budget = await budgetRepository.upsert(userId, catId, d.getFullYear(), d.getMonth() + 1, {}, session);
      if (budget?._id) {
        const { default: Budget } = await import('../models/Budget.js');
        await Budget.recalculateSpent(budget._id, session);
      }
    }

    await session.commitTransaction();

    const populatedMovement = await movementRepository.findByIdAndUserWithPopulate(movement._id, userId);
    res.json({ success: true, data: populatedMovement });
  } catch (error) {
    if (session.inTransaction()) {
      try { await session.abortTransaction(); } catch { /* noop */ }
    }
    next(error);
  } finally {
    await session.endSession();
  }
};

export const deleteMovement = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user.id;

    session.startTransaction();

    const movement = await Movement.findOne({ _id: req.params.id, userId, deletedAt: null }).session(session);
    if (!movement) throw AppError.notFound('Movimiento no encontrado');

    const accountId = movement.accountId.toString();
    const categoryId = movement.categoryId.toString();
    const movementDate = movement.date;
    const wasExpense = movement.type === 'expense';

    movement.deletedAt = new Date(); // soft delete: no se destruye información
    await movement.save({ session });

    await recomputeAccountBalance(accountId, userId, session);

    if (wasExpense) {
      const d = new Date(movementDate);
      const budget = await budgetRepository.upsert(userId, categoryId, d.getFullYear(), d.getMonth() + 1, {}, session);
      if (budget?._id) {
        const { default: Budget } = await import('../models/Budget.js');
        await Budget.recalculateSpent(budget._id, session);
      }
    }

    await session.commitTransaction();
    res.json({ success: true, message: 'Movimiento eliminado correctamente' });
  } catch (error) {
    if (session.inTransaction()) {
      try { await session.abortTransaction(); } catch { /* noop */ }
    }
    next(error);
  } finally {
    await session.endSession();
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const { year, month } = req.sanitizedQuery || req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth() + 1;

    const [current, previous] = await Promise.all([
      movementRepository.getMonthlySummary(req.user.id, currentYear, currentMonth),
      movementRepository.getMonthlySummary(req.user.id, prevYear, prevMonth)
    ]);

    const currentIncome = roundMoney(current.find(c => c.type === 'income')?.total || 0);
    const currentExpense = roundMoney(current.find(c => c.type === 'expense')?.total || 0);
    const previousIncome = roundMoney(previous.find(c => c.type === 'income')?.total || 0);
    const previousExpense = roundMoney(previous.find(c => c.type === 'expense')?.total || 0);

    const balance = roundMoney(currentIncome - currentExpense);
    const expensePercentage = currentIncome > 0 ? roundMoney((currentExpense / currentIncome) * 100) : 0;
    const prevBalance = roundMoney(previousIncome - previousExpense);

    res.json({
      success: true,
      data: {
        income: { total: currentIncome, count: current.find(c => c.type === 'income')?.count || 0 },
        expense: { total: currentExpense, count: current.find(c => c.type === 'expense')?.count || 0 },
        balance,
        expensePercentage,
        previousMonth: { income: previousIncome, expense: previousExpense, balance: prevBalance },
        variation: {
          incomePct: previousIncome > 0 ? roundMoney(((currentIncome - previousIncome) / previousIncome) * 100) : (currentIncome > 0 ? 100 : 0),
          expensePct: previousExpense > 0 ? roundMoney(((currentExpense - previousExpense) / previousExpense) * 100) : (currentExpense > 0 ? 100 : 0),
          balancePct: prevBalance !== 0 ? roundMoney(((balance - prevBalance) / Math.abs(prevBalance)) * 100) : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
