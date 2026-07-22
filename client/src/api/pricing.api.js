import { api } from './client';

export const pricingApi = {
  list: () => api.get('/pricing'),
  set: (service_type, price) => api.put('/pricing', { service_type, price }),
};
