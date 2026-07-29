import { api, getAuthToken } from './client';

export const jobsApi = {
  byMonth: (month) => api.get(`/jobs?month=${month}`),
  byDate: (date) => api.get(`/jobs?date=${date}`),
  detail: (id) => api.get(`/jobs/${id}`),
  technicians: () => api.get('/jobs/technicians'),
  stats: () => api.get('/jobs/stats'),
  upcoming: (limit = 6) => api.get(`/jobs/upcoming?limit=${limit}`),
  toAssign: () => api.get('/jobs/to-assign'),
  completeRequests: (status) => api.get(`/jobs/complete-requests${status ? `?status=${status}` : ''}`),
  confirm: (id) => api.patch(`/jobs/${id}/confirm`, {}),
  card: (id) => api.get(`/jobs/${id}/card`),
  photos: (id) => api.get(`/jobs/${id}/photos`),
  async photoUrl(jobId, photoId) {
    const res = await fetch(`/api/jobs/${jobId}/photos/${photoId}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!res.ok) throw new Error('Could not load photo');
    return URL.createObjectURL(await res.blob());
  },
  deleted: () => api.get('/jobs/deleted'),
  cancelled: () => api.get('/jobs/cancelled'),
  assign: (id, technician_id) => api.patch(`/jobs/${id}/assign`, { technician_id }),
  postpone: (id, days, reason) => api.patch(`/jobs/${id}/postpone`, { days, reason }),
  cancel: (id, reason) => api.patch(`/jobs/${id}/cancel`, { reason }),
  softDelete: (id) => api.patch(`/jobs/${id}/soft-delete`, {}),
  comment: (id, comments) => api.patch(`/jobs/${id}/comment`, { comments }),
};
