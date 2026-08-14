import { getDB, saveDB } from './mockStore';

export const technicianApi = {
  getTodayJobs: async () => {
    const db = getDB();
    const todayStr = new Date().toISOString().slice(0, 10);
    // In mock, return tech_kamal (id 3) jobs or all assigned technician jobs
    const jobs = db.jobs.filter(j => !j.is_deleted && j.technician_id && (j.scheduled_date === todayStr || j.status === 'in_progress'));
    return jobs.map(j => {
      const agreement = db.agreements.find(a => a.id === j.agreement_id) || {};
      const customer = db.customers.find(c => c.id === agreement.customer_id) || {};
      const acUnit = db.ac_units.find(a => a.id === agreement.ac_unit_id) || {};
      const photos = db.job_photos.filter(p => p.job_id === j.id);
      return {
        ...j,
        agreement_no: agreement.agreement_no,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        customer_route: customer.route,
        ac_brand: acUnit.brand,
        ac_model: acUnit.model,
        ac_serial_in: acUnit.serial_indoor,
        ac_serial_out: acUnit.serial_outdoor,
        photos
      };
    });
  },

  searchJobs: async (query = '') => {
    const db = getDB();
    const q = query.trim().toLowerCase();
    const jobs = db.jobs.filter(j => !j.is_deleted);
    const results = jobs.map(j => {
      const agreement = db.agreements.find(a => a.id === j.agreement_id) || {};
      const customer = db.customers.find(c => c.id === agreement.customer_id) || {};
      return {
        ...j,
        agreement_no: agreement.agreement_no,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address
      };
    });

    if (!q) return results.slice(0, 20);
    return results.filter(r => 
      r.agreement_no.toLowerCase().includes(q) || 
      r.customer_name.toLowerCase().includes(q) || 
      r.customer_phone.includes(q)
    );
  },

  getJobDetail: async (id) => {
    const db = getDB();
    const job = db.jobs.find(j => j.id === Number(id));
    if (!job) throw new Error('Job not found');
    const agreement = db.agreements.find(a => a.id === job.agreement_id) || {};
    const customer = db.customers.find(c => c.id === agreement.customer_id) || {};
    const acUnit = db.ac_units.find(a => a.id === agreement.ac_unit_id) || {};
    const photos = db.job_photos.filter(p => p.job_id === job.id);
    return {
      ...job,
      agreement_no: agreement.agreement_no,
      customer,
      acUnit,
      photos
    };
  },

  startJob: async (id) => {
    const db = getDB();
    const job = db.jobs.find(j => j.id === Number(id));
    if (job) {
      job.status = 'in_progress';
      saveDB(db);
    }
    return { ok: true };
  },

  completeJob: async (id, serviceType, comments) => {
    const db = getDB();
    const job = db.jobs.find(j => j.id === Number(id));
    if (job) {
      job.status = 'completed';
      job.service_type_used = serviceType;
      job.comments = comments;
      job.completed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      job.admin_confirmed = false;
      saveDB(db);
    }
    return { ok: true };
  },

  uploadPhoto: async (jobId, file) => {
    const db = getDB();
    const newId = Math.max(...db.job_photos.map(p => p.id), 0) + 1;
    // Generate a high quality unsplash AC servicing demo photo or data URL
    const demoPhotos = [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&auto=format&fit=crop'
    ];
    const photoPath = demoPhotos[newId % demoPhotos.length];
    const photo = {
      id: newId,
      job_id: Number(jobId),
      photo_path: photoPath,
      uploaded_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      uploaded_by: 3
    };
    db.job_photos.push(photo);
    saveDB(db);
    return photo;
  }
};
