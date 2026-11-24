import api from './api';

export const accountApi = {
  list: (params) => api.get('/accounts', { params }),
  get: (id, params) => api.get(`/accounts/${id}`, { params }),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
  recalculate: (id) => api.post(`/accounts/${id}/recalculate`)
};