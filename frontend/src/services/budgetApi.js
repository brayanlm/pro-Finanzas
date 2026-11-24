import api from './api';

export const budgetApi = {
  list: (params) => api.get('/budgets', { params }),
  get: (id) => api.get(`/budgets/${id}`),
  upsert: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getSummary: (params) => api.get('/budgets/stats/summary', { params })
};