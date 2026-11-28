import { useState, useCallback, useEffect } from 'react';
import { categoryApi } from '../services/categoryApi';
import { useToast } from '../context/ToastContext';

export const useCategories = (type = null) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = type ? { type } : {};
      const response = await categoryApi.list(params);
      setCategories(response.data.data);
    } catch {
      showError('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, [type, showError]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (data) => {
    const response = await categoryApi.create(data);
    await fetchCategories();
    showSuccess('Categoría creada');
    return response.data;
  };

  const updateCategory = async (id, data) => {
    const response = await categoryApi.update(id, data);
    await fetchCategories();
    showSuccess('Categoría actualizada');
    return response.data;
  };

  const deleteCategory = async (id) => {
    await categoryApi.delete(id);
    await fetchCategories();
    showSuccess('Categoría eliminada');
  };

  const seedDefaults = async () => {
    await categoryApi.seedDefaults();
    await fetchCategories();
    showSuccess('Categorías por defecto creadas');
  };

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    seedDefaults
  };
};