import { useState, useCallback } from 'react';
import { movementApi } from '../services/movementApi';
import { useToast } from '../context/ToastContext';

export const useMovements = (initialFilters = {}) => {
  const [movements, setMovements] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const { showError } = useToast();

  const fetchMovements = useCallback(async (newFilters = filters) => {
    setLoading(true);
    try {
      const response = await movementApi.list(newFilters);
      setMovements(response.data.data);
      setMeta(response.data.meta);
    } catch {
      showError('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  const createMovement = async (data) => {
    const response = await movementApi.create(data);
    await fetchMovements();
    return response.data;
  };

  const updateMovement = async (id, data) => {
    const response = await movementApi.update(id, data);
    await fetchMovements();
    return response.data;
  };

  const deleteMovement = async (id) => {
    await movementApi.delete(id);
    await fetchMovements();
  };

  const getSummary = async (params) => {
    try {
      const response = await movementApi.getSummary(params);
      return response.data.data;
    } catch {
      showError('Error al cargar resumen');
      return null;
    }
  };

  return {
    movements,
    meta,
    loading,
    filters,
    setFilters,
    fetchMovements,
    createMovement,
    updateMovement,
    deleteMovement,
    getSummary
  };
};