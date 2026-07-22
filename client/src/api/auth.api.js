import { api } from './client';

export const authApi = {
  login: (phone, password) => api.post('/auth/login', { phone, password }),
  me: () => api.get('/auth/me'),
};
