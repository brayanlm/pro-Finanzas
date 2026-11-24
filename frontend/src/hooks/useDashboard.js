import { useState, useCallback } from 'react';
import { dashboardApi } from '../services/dashboardApi';
import { useToast } from '../context/ToastContext';

export const useDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.getSummary();
      setSummary(response.data.data);
    } catch (error) {
      showError('Error al cargar resumen del dashboard');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchCharts = useCallback(async (period = '12m') => {
    try {
      const response = await dashboardApi.getCharts({ period });
      setCharts(response.data.data);
    } catch (error) {
      showError('Error al cargar gráficos');
    }
  }, [showError]);

  const fetchAll = useCallback(async (period = '12m') => {
    await Promise.all([fetchSummary(), fetchCharts(period)]);
  }, [fetchSummary, fetchCharts]);

  return {
    summary,
    charts,
    loading,
    fetchAll,
    fetchSummary,
    fetchCharts
  };
};