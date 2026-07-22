import { api } from './client';

export const jobsApi = {
  byMonth: (month) => api.get(`/jobs?month=${month}`),
  byDate: (date) => api.get(`/jobs?date=${date}`),
  detail: (id) => api.get(`/jobs/${id}`),
  technicians: () => api.get('/jobs/technicians'),
  stats: () => api.get('/jobs/stats'),
  upcoming: (limit = 6) => api.get(`/jobs/upcoming?limit=${limit}`),
  deleted: () => api.get('/jobs/deleted'),
  cancelled: () => api.get('/jobs/cancelled'),
  assign: (id, technician_id) => api.patch(`/jobs/${id}/assign`, { technician_id }),
  postpone: (id, days, reason) => api.patch(`/jobs/${id}/postpone`, { days, reason }),
  cancel: (id, reason) => api.patch(`/jobs/${id}/cancel`, { reason }),
  softDelete: (id) => api.patch(`/jobs/${id}/soft-delete`, {}),
  comment: (id, comments) => api.patch(`/jobs/${id}/comment`, { comments }),
};
