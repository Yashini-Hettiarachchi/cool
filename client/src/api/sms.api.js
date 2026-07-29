import { api } from './client';

export const smsApi = {
  templates: () => api.get('/sms/templates'),
  saveTemplate: (type, body) => api.put(`/sms/templates/${type}`, { body }),
  resetTemplate: (type) => api.del(`/sms/templates/${type}`),
  logs: ({ type = '', status = '', q = '', limit = 200 } = {}) => {
    const qs = new URLSearchParams();
    if (type) qs.set('type', type);
    if (status) qs.set('status', status);
    if (q) qs.set('q', q);
    qs.set('limit', limit);
    return api.get(`/sms/logs?${qs.toString()}`);
  },
  remindersPreview: (date) => api.get(`/sms/reminders/preview${date ? `?date=${date}` : ''}`),
  test: (phone, type) => api.post('/sms/test', { phone, type }),
};
