import { useState, useCallback, useEffect } from 'react';
import { accountApi } from '../services/accountApi';
import { useToast } from '../context/ToastContext';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  const fetchAccounts = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await accountApi.list(params);
      setAccounts(response.data.data);
    } catch (error) {
      showError('Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (data) => {
    const response = await accountApi.create(data);
    await fetchAccounts();
    showSuccess('Cuenta creada');
    return response.data;
  };

  const updateAccount = async (id, data) => {
    const response = await accountApi.update(id, data);
    await fetchAccounts();
    showSuccess('Cuenta actualizada');
    return response.data;
  };

  const deleteAccount = async (id) => {
    await accountApi.delete(id);
    await fetchAccounts();
    showSuccess('Cuenta eliminada');
  };

  const recalculateBalance = async (id) => {
    const response = await accountApi.recalculate(id);
    await fetchAccounts();
    showSuccess('Balance recalculado');
    return response.data;
  };

  return {
    accounts,
    loading,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    recalculateBalance
  };
};