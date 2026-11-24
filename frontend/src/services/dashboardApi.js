import api from './api';

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getCharts: (params) => api.get('/dashboard/charts', { params })
};