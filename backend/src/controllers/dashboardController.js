import { movementRepository } from '../repositories/index.js';
import { accountRepository } from '../repositories/index.js';
import { budgetRepository } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth() + 1;

    const [currentSummary, previousSummary, recentMovements, accounts] = await Promise.all([
      movementRepository.getMonthlySummary(req.user.id, currentYear, currentMonth),
      movementRepository.getMonthlySummary(req.user.id, prevYear, prevMonth),
      movementRepository.getRecent(req.user.id, 10),
      accountRepository.findByUser(req.user.id, { isActive: true })
    ]);

    const currentIncome = currentSummary.find(c => c.type === 'income')?.total || 0;
    const currentExpense = currentSummary.find(c => c.type === 'expense')?.total || 0;
    const previousIncome = previousSummary.find(c => c.type === 'income')?.total || 0;
    const previousExpense = previousSummary.find(c => c.type === 'expense')?.total || 0;

    const balance = currentIncome - currentExpense;
    const expensePercentage = currentIncome > 0 ? ((currentExpense / currentIncome) * 100) : 0;

    const recentWithPopulate = await Promise.all(
      recentMovements.map(async (m) => {
        const [category, account] = await Promise.all([
          (await import('../repositories/index.js')).categoryRepository.findById(m.categoryId),
          (await import('../repositories/index.js')).accountRepository.findById(m.accountId)
        ]);
        return {
          ...m,
          category: category ? { name: category.name, color: category.color } : null,
          account: account ? { name: account.name } : null
        };
      })
    );

    const budgetsSummary = await budgetRepository.getSummary(req.user.id, currentYear, currentMonth);

    res.json({
      success: true,
      data: {
        availableBalance: balance,
        monthlyIncome: currentIncome,
        monthlyExpense: currentExpense,
        monthlyBalance: balance,
        expensePercentage: Math.round(expensePercentage * 100) / 100,
        previousMonthComparison: {
          income: { current: currentIncome, previous: previousIncome, variation: previousIncome > 0 ? Math.round(((currentIncome - previousIncome) / previousIncome) * 10000) / 100 : (currentIncome > 0 ? 100 : 0) },
          expense: { current: currentExpense, previous: previousExpense, variation: previousExpense > 0 ? Math.round(((currentExpense - previousExpense) / previousExpense) * 10000) / 100 : (currentExpense > 0 ? 100 : 0) },
          balance: { current: balance, previous: previousIncome - previousExpense, variation: (previousIncome - previousExpense) !== 0 ? Math.round(((balance - (previousIncome - previousExpense)) / Math.abs(previousIncome - previousExpense)) * 10000) / 100 : 0 }
        },
        recentMovements: recentWithPopulate,
        accountsSummary: accounts.map(a => ({ id: a._id, name: a.name, type: a.type, currentBalance: a.currentBalance, currency: a.currency })),
        budgetsAlert: {
          total: budgetsSummary.byAlertLevel?.normal + budgetsSummary.byAlertLevel?.warning + budgetsSummary.byAlertLevel?.danger + budgetsSummary.byAlertLevel?.critical || 0,
          warning: budgetsSummary.byAlertLevel?.warning || 0,
          danger: budgetsSummary.byAlertLevel?.danger || 0,
          critical: budgetsSummary.byAlertLevel?.critical || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardCharts = async (req, res, next) => {
  try {
    const { period = '12m' } = req.query;
    const months = period === '6m' ? 6 : period === '24m' ? 24 : 12;

    const [evolution, expenseDistribution, incomeVsExpense, topExpenseCategories] = await Promise.all([
      movementRepository.getMonthlyEvolution(req.user.id, months),
      movementRepository.getCategoryDistribution(req.user.id, 'expense', new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()),
      (async () => {
        const data = [];
        for (let i = months - 1; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const summary = await movementRepository.getMonthlySummary(req.user.id, year, month);
          const income = summary.find(s => s.type === 'income')?.total || 0;
          const expense = summary.find(s => s.type === 'expense')?.total || 0;
          data.push({ month: `${year}-${String(month).padStart(2, '0')}`, income, expense });
        }
        return data;
      })(),
      movementRepository.getCategoryDistribution(req.user.id, 'expense', new Date(new Date().getFullYear(), new Date().getMonth() - months + 1, 1), new Date())
    ]);

    const balanceEvolution = evolution.map(e => ({
      month: `${e.year}-${String(e.month).padStart(2, '0')}`,
      balance: e.balance
    }));

    res.json({
      success: true,
      data: {
        incomeVsExpense,
        expenseDistribution: expenseDistribution.slice(0, 8),
        balanceEvolution,
        topExpenseCategories: topExpenseCategories.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};