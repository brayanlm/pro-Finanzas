import api from './api';

export const movementApi = {
  list: (params) => api.get('/movements', { params }),
  get: (id) => api.get(`/movements/${id}`),
  create: (data) => api.post('/movements', data),
  update: (id, data) => api.put(`/movements/${id}`, data),
  delete: (id) => api.delete(`/movements/${id}`),
  getSummary: (params) => api.get('/movements/stats/summary', { params })
};