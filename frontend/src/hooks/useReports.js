import { useState, useCallback } from 'react';
import { reportApi } from '../services/reportApi';
import { useToast } from '../context/ToastContext';

export const useReports = () => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { showError, showSuccess } = useToast();

  const fetchPreview = useCallback(async (filters) => {
    setLoading(true);
    try {
      const response = await reportApi.preview(filters);
      setPreview(response.data.data);
    } catch (error) {
      showError('Error al cargar vista previa');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const exportReport = async (filters, format) => {
    setExporting(true);
    try {
      const response = await reportApi.export({ ...filters, format });
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `reporte-${date}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess(`Reporte exportado a ${format.toUpperCase()}`);
    } catch (error) {
      showError('Error al exportar reporte');
    } finally {
      setExporting(false);
    }
  };

  return {
    preview,
    loading,
    exporting,
    fetchPreview,
    exportReport
  };
};