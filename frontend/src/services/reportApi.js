import api from './api';

export const reportApi = {
  export: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
  preview: (params) => api.get('/reports/movements', { params })
};