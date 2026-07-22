import { api } from './client';

export const agreementsApi = {
  getByNumber: (number) => api.get(`/agreements/${encodeURIComponent(number)}`),
  create: (payload) => api.post('/agreements', payload),
};
