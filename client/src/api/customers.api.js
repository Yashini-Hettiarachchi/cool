import { api } from './client';

export const customersApi = {
  list: () => api.get('/customers'),
  search: (q) => api.get(`/customers/search?q=${encodeURIComponent(q)}`),
  profile: (id) => api.get(`/customers/${id}`),
  create: (payload) => api.post('/customers', payload),
};
