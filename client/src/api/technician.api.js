import { api, getAuthToken } from './client';

export const techApi = {
  /** Today's jobs assigned to the signed-in technician. */
  today: () => api.get('/jobs/mine/today'),

  /** Every visit assigned to the signed-in technician (open first, then done). */
  mine: () => api.get('/jobs/mine'),

  /** All visits under an AS- number. */
  byAgreement: (asNumber) => api.get(`/jobs/by-agreement/${encodeURIComponent(asNumber)}`),

  /** Single job detail (assigned-only for technicians). */
  detail: (id) => api.get(`/jobs/${id}`),

  /** Start / complete. Completing requires serviceType (normal|hp). */
  setStatus: (id, status, serviceType) =>
    api.patch(`/jobs/${id}/status`, { status, service_type_used: serviceType }),

  /** Upload one or more photos (File[]). */
  uploadPhotos: (id, files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('photos', f));
    return api.postForm(`/jobs/${id}/photos`, fd);
  },

  /** Add / update a comment on the job. */
  comment: (id, comments) => api.patch(`/jobs/${id}/comment`, { comments }),

  /** Photo metadata list. */
  photos: (id) => api.get(`/jobs/${id}/photos`),

  /** Fetch a photo as an object URL (authenticated — JWT lives in memory). */
  async photoUrl(jobId, photoId) {
    const res = await fetch(`/api/jobs/${jobId}/photos/${photoId}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!res.ok) throw new Error('Could not load photo');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};
