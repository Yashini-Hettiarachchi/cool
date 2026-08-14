import { getDB, saveDB } from './mockStore';

export const smsApi = {
  getTemplates: async () => {
    const db = getDB();
    return db.sms_templates;
  },
  updateTemplate: async (type, body) => {
    const db = getDB();
    const t = db.sms_templates.find(item => item.template_type === type);
    if (t) {
      t.body = body;
      t.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      saveDB(db);
    }
    return { ok: true };
  },
  sendTest: async (type, phone) => {
    const db = getDB();
    const newLogId = Math.max(...db.sms_logs.map(l => l.id), 0) + 1;
    const log = {
      id: newLogId,
      customer_id: 1,
      job_id: null,
      template_type: type,
      message: `[TEST SMS to ${phone}] Sample message for ${type}`,
      sent_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      status: 'sent'
    };
    db.sms_logs.unshift(log);
    saveDB(db);
    return { ok: true, result: log };
  },
  getLogs: async (search = '', status = '', type = '', page = 1, limit = 20) => {
    const db = getDB();
    let filtered = db.sms_logs;
    const s = search.trim().toLowerCase();
    if (s) {
      filtered = filtered.filter(l => l.message.toLowerCase().includes(s));
    }
    if (status) {
      filtered = filtered.filter(l => l.status === status);
    }
    if (type) {
      filtered = filtered.filter(l => l.template_type === type);
    }
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit).map(l => {
      const customer = db.customers.find(c => c.id === l.customer_id) || {};
      const job = db.jobs.find(j => j.id === l.job_id);
      const agreement = job ? db.agreements.find(a => a.id === job.agreement_id) : null;
      return {
        ...l,
        customer_name: customer.name || 'Test User',
        customer_phone: customer.phone || '0770000000',
        agreement_no: agreement ? agreement.agreement_no : null
      };
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }
};
