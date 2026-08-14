import { getDB, saveDB } from './mockStore';

export const jobsApi = {
  getCalendar: async (year, month) => {
    const db = getDB();
    const y = Number(year);
    const m = String(month).padStart(2, '0');
    const prefix = `${y}-${m}`;

    const jobs = db.jobs.filter(j => !j.is_deleted && j.scheduled_date.startsWith(prefix));

    return jobs.map(j => {
      const agreement = db.agreements.find(a => a.id === j.agreement_id) || {};
      const customer = db.customers.find(c => c.id === agreement.customer_id) || {};
      const tech = db.users.find(u => u.id === j.technician_id) || {};
      return {
        ...j,
        agreement_no: agreement.agreement_no,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        technician_name: tech.name || null
      };
    });
  },

  getUnassigned: async () => {
    const db = getDB();
    const jobs = db.jobs.filter(j => !j.is_deleted && j.status === 'scheduled' && !j.technician_id);
    return jobs.map(j => {
      const agreement = db.agreements.find(a => a.id === j.agreement_id) || {};
      const customer = db.customers.find(c => c.id === agreement.customer_id) || {};
      const acUnit = db.ac_units.find(a => a.id === agreement.ac_unit_id) || {};
      return {
        ...j,
        agreement_no: agreement.agreement_no,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_route: customer.route,
        ac_brand: acUnit.brand,
        ac_model: acUnit.model
      };
    });
  },

  assignTechnician: async (jobId, technicianId) => {
    const db = getDB();
    const job = db.jobs.find(j => j.id === Number(jobId));
    if (job) {
      job.technician_id = technicianId ? Number(technicianId) : null;
      saveDB(db);
    }
    return { ok: true };
  },

  getUnconfirmed: async () => {
    const db = getDB();
    const jobs = db.jobs.filter(j => !j.is_deleted && j.status === 'completed' && !j.admin_confirmed);
    return jobs.map(j => {
      const agreement = db.agreements.find(a => a.id === j.agreement_id) || {};
      const customer = db.customers.find(c => c.id === agreement.customer_id) || {};
      const tech = db.users.find(u => u.id === j.technician_id) || {};
      const photos = db.job_photos.filter(p => p.job_id === j.id);
      return {
        ...j,
        agreement_no: agreement.agreement_no,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_route: customer.route,
        technician_name: tech.name,
        photos
      };
    });
  },

  confirmCompletion: async (jobId) => {
    const db = getDB();
    const job = db.jobs.find(j => j.id === Number(jobId));
    if (job) {
      job.admin_confirmed = true;
      saveDB(db);
    }
    return { ok: true };
  },

  getSlotDetail: async (id) => {
    const db = getDB();
    const job = db.jobs.find(j => j.id === Number(id));
    if (!job) throw new Error('Job not found');
    const agreement = db.agreements.find(a => a.id === job.agreement_id) || {};
    const customer = db.customers.find(c => c.id === agreement.customer_id) || {};
    const acUnit = db.ac_units.find(a => a.id === agreement.ac_unit_id) || {};
    const tech = db.users.find(u => u.id === job.technician_id) || {};
    const photos = db.job_photos.filter(p => p.job_id === job.id);
    return {
      ...job,
      agreement_no: agreement.agreement_no,
      customer,
      acUnit,
      technician_name: tech.name || null,
      photos
    };
  },

  postpone: async (id, postponeDays, postponeReason) => {
    const db = getDB();
    const job = db.jobs.find(j => j.id === Number(id));
    if (job) {
      const orig = new Date(job.scheduled_date);
      job.postponed_from = job.scheduled_date;
      job.postpone_days = Number(postponeDays);
      job.postpone_reason = postponeReason;
      orig.setDate(orig.getDate() + Number(postponeDays));
      job.scheduled_date = orig.toISOString().slice(0, 10);
      job.status = 'postponed';
      saveDB(db);
    }
    return { ok: true };
  },

  updateComments: async (id, comments) => {
    const db = getDB();
    const job = db.jobs.find(j => j.id === Number(id));
    if (job) {
      job.comments = comments;
      saveDB(db);
    }
    return { ok: true };
  },

  cancel: async (id, cancelReason) => {
    const db = getDB();
    const job = db.jobs.find(j => j.id === Number(id));
    if (job) {
      job.status = 'cancelled';
      job.cancel_reason = cancelReason;
      saveDB(db);
    }
    return { ok: true };
  },

  softDelete: async (id) => {
    const db = getDB();
    const job = db.jobs.find(j => j.id === Number(id));
    if (job) {
      job.is_deleted = true;
      saveDB(db);
    }
    return { ok: true };
  },

  restore: async (id) => {
    const db = getDB();
    const job = db.jobs.find(j => j.id === Number(id));
    if (job) {
      job.is_deleted = false;
      saveDB(db);
    }
    return { ok: true };
  },

  getCancelled: async () => {
    const db = getDB();
    const jobs = db.jobs.filter(j => !j.is_deleted && j.status === 'cancelled');
    return jobs.map(j => {
      const agreement = db.agreements.find(a => a.id === j.agreement_id) || {};
      const customer = db.customers.find(c => c.id === agreement.customer_id) || {};
      return {
        ...j,
        agreement_no: agreement.agreement_no,
        customer_name: customer.name,
        customer_phone: customer.phone
      };
    });
  },

  getDeleted: async () => {
    const db = getDB();
    const jobs = db.jobs.filter(j => j.is_deleted);
    return jobs.map(j => {
      const agreement = db.agreements.find(a => a.id === j.agreement_id) || {};
      const customer = db.customers.find(c => c.id === agreement.customer_id) || {};
      return {
        ...j,
        agreement_no: agreement.agreement_no,
        customer_name: customer.name,
        customer_phone: customer.phone
      };
    });
  },

  getDashboardMetrics: async () => {
    const db = getDB();
    const todayStr = new Date().toISOString().slice(0, 10);
    const unassigned = db.jobs.filter(j => !j.is_deleted && j.status === 'scheduled' && !j.technician_id).length;
    const inProgress = db.jobs.filter(j => !j.is_deleted && j.status === 'in_progress').length;
    const pendingApproval = db.jobs.filter(j => !j.is_deleted && j.status === 'completed' && !j.admin_confirmed).length;
    const todayVisits = db.jobs.filter(j => !j.is_deleted && j.scheduled_date === todayStr).length;

    const upcoming = db.jobs
      .filter(j => !j.is_deleted && j.scheduled_date >= todayStr)
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
      .slice(0, 10)
      .map(j => {
        const agreement = db.agreements.find(a => a.id === j.agreement_id) || {};
        const customer = db.customers.find(c => c.id === agreement.customer_id) || {};
        const tech = db.users.find(u => u.id === j.technician_id) || {};
        return {
          ...j,
          agreement_no: agreement.agreement_no,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_route: customer.route,
          technician_name: tech.name || null
        };
      });

    return { unassigned, inProgress, pendingApproval, todayVisits, upcoming };
  }
};
