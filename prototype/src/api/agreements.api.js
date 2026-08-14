import { getDB, saveDB } from './mockStore';

export const agreementsApi = {
  create: async (data) => {
    const db = getDB();
    const isoDT = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
    const isoDate = (d) => d.toISOString().slice(0, 10);
    const addDays = (base, n) => { const d = new Date(base); d.setDate(d.getDate() + n); return isoDate(d); };

    // 1. Customer
    let customerId = data.customerId;
    if (!customerId && data.customer) {
      customerId = Math.max(...db.customers.map(c => c.id), 0) + 1;
      db.customers.unshift({
        id: customerId,
        name: data.customer.name,
        phone: data.customer.phone,
        nic: data.customer.nic,
        address: data.customer.address || '',
        route: data.customer.route || '',
        created_at: isoDT(new Date())
      });
    }

    // 2. AC Unit
    let acUnitId = data.acUnitId;
    if (!acUnitId && data.acUnit) {
      acUnitId = Math.max(...db.ac_units.map(a => a.id), 0) + 1;
      db.ac_units.unshift({
        id: acUnitId,
        customer_id: customerId,
        model: data.acUnit.model || '',
        brand: data.acUnit.brand || '',
        serial_indoor: data.acUnit.serialIndoor || '',
        serial_outdoor: data.acUnit.serialOutdoor || '',
        install_notes: data.acUnit.installNotes || ''
      });
    }

    // 3. Agreement AS-
    const maxAS = db.agreements.reduce((max, a) => {
      const num = parseInt(a.agreement_no.replace('AS-', ''), 10) || 0;
      return num > max ? num : max;
    }, 0);
    const agreementNo = `AS-${String(maxAS + 1).padStart(5, '0')}`;
    const agreementId = Math.max(...db.agreements.map(a => a.id), 0) + 1;

    const normalCount = Number(data.normalCount || 0);
    const hpCount = Number(data.hpCount || 0);
    const periodDays = Number(data.periodDays || 90);
    const price = Number(data.price || 0);
    const startDate = data.startDate;
    const endDate = addDays(startDate, 365);

    const agreement = {
      id: agreementId,
      agreement_no: agreementNo,
      customer_id: customerId,
      ac_unit_id: acUnitId,
      normal_count: normalCount,
      hp_count: hpCount,
      period_days: periodDays,
      price,
      start_date: startDate,
      end_date: endDate,
      amount_paid: Number(data.amountPaid || price),
      status: 'active',
      parent_agreement_id: data.parentAgreementId || null,
      created_by: 1,
      created_at: isoDT(new Date())
    };

    db.agreements.unshift(agreement);

    // 4. Generate scheduled jobs
    const totalJobs = normalCount + hpCount;
    let newJobId = Math.max(...db.jobs.map(j => j.id), 0);
    for (let i = 0; i < totalJobs; i++) {
      newJobId++;
      db.jobs.push({
        id: newJobId,
        agreement_id: agreementId,
        scheduled_date: addDays(startDate, i * periodDays),
        status: 'scheduled',
        technician_id: null,
        service_type_used: null,
        admin_confirmed: false,
        is_deleted: false,
        postponed_from: null,
        postpone_days: null,
        postpone_reason: null,
        cancel_reason: null,
        comments: null,
        completed_at: null,
        created_at: isoDT(new Date())
      });
    }

    saveDB(db);
    return agreement;
  },

  getDetail: async (id) => {
    const db = getDB();
    const agreement = db.agreements.find(a => a.id === Number(id));
    if (!agreement) throw new Error('Agreement not found');
    const customer = db.customers.find(c => c.id === agreement.customer_id);
    const acUnit = db.ac_units.find(a => a.id === agreement.ac_unit_id);
    const jobs = db.jobs.filter(j => j.agreement_id === agreement.id && !j.is_deleted);
    return { ...agreement, customer, acUnit, jobs };
  }
};
