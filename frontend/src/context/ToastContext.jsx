import { createContext, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const showSuccess = useCallback((message) => {
    toast.success(message);
  }, []);

  const showError = useCallback((message) => {
    toast.error(message);
  }, []);

  const showInfo = useCallback((message) => {
    toast.info(message);
  }, []);

  const showWarning = useCallback((message) => {
    toast.warning(message);
  }, []);

  const value = {
    showSuccess,
    showError,
    showInfo,
    showWarning
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};