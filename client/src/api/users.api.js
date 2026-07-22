import { api } from './client';

export const usersApi = {
  list: () => api.get('/users'),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  deactivate: (id) => api.del(`/users/${id}`),
};
