import { useState, useCallback, useEffect } from 'react';
import { budgetApi } from '../services/budgetApi';
import { useToast } from '../context/ToastContext';

export const useBudgets = (month = null, year = null) => {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(month || new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(year || new Date().getFullYear());
  const { showError, showSuccess } = useToast();

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetsRes, summaryRes] = await Promise.all([
        budgetApi.list({ month: currentMonth, year: currentYear }),
        budgetApi.getSummary({ month: currentMonth, year: currentYear })
      ]);
      setBudgets(budgetsRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (error) {
      showError('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, showError]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const upsertBudget = async (data) => {
    const response = await budgetApi.upsert({ ...data, month: currentMonth, year: currentYear });
    await fetchBudgets();
    showSuccess('Presupuesto guardado');
    return response.data;
  };

  const updateBudget = async (id, data) => {
    const response = await budgetApi.update(id, data);
    await fetchBudgets();
    showSuccess('Presupuesto actualizado');
    return response.data;
  };

  const deleteBudget = async (id) => {
    await budgetApi.delete(id);
    await fetchBudgets();
    showSuccess('Presupuesto eliminado');
  };

  const setMonth = (month) => {
    setCurrentMonth(month);
  };

  const setYear = (year) => {
    setCurrentYear(year);
  };

  return {
    budgets,
    summary,
    loading,
    currentMonth,
    currentYear,
    setMonth,
    setYear,
    fetchBudgets,
    upsertBudget,
    updateBudget,
    deleteBudget
  };
};