/**
 * Fake Backend Mock Store — LocalStorage Persisted State
 * Pre-seeded with 5 customer scenarios matching server/db/seed-demo.js.
 */

const STORAGE_KEY = 'highcool_prototype_db_v1';

const today = new Date();
const isoDate = (d) => d.toISOString().slice(0, 10);
const isoDT = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return isoDate(d); };
const dtDaysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return isoDT(d); };
const dtYearsAgo = (n) => { const d = new Date(today); d.setFullYear(d.getFullYear() - n); return isoDT(d); };
const dateYearsAgo = (n) => { const d = new Date(today); d.setFullYear(d.getFullYear() - n); return isoDate(d); };

const defaultSeed = {
  users: [
    { id: 1, name: 'Administrator', username: 'admin', phone: '0770000000', role: 'admin', active: true, password: 'admin123' },
    { id: 2, name: 'Office Staff User', username: 'user', phone: '0771111111', role: 'system_user', active: true, password: 'user123' },
    { id: 3, name: 'Kamal Perera', username: 'tech_kamal', phone: '0772222222', role: 'technician', active: true, password: 'tech123' },
    { id: 4, name: 'Nimal Fernando', username: 'tech_nimal', phone: '0773333333', role: 'technician', active: true, password: 'tech123' }
  ],
  pricing: [
    { id: 1, service_type: 'normal', price: 3500.00, updated_at: isoDT(today) },
    { id: 2, service_type: 'hp', price: 5000.00, updated_at: isoDT(today) }
  ],
  customers: [
    { id: 1, name: 'Saman Kumara', phone: '0799900001', nic: '901234567V', address: '12 Lake Rd, Kandy', route: 'Kandy', created_at: isoDT(today) },
    { id: 2, name: 'Dilani Perera', phone: '0799900002', nic: '885550123V', address: '48 Galle Rd, Colombo 03', route: 'Colombo', created_at: isoDT(today) },
    { id: 3, name: 'Ruwan Fernando', phone: '0799900003', nic: '921112223V', address: '7 Temple St, Galle', route: 'Galle', created_at: isoDT(today) },
    { id: 4, name: 'Nadeesha Silva', phone: '0799900004', nic: '937778889V', address: '90 Hill St, Nuwara Eliya', route: 'Nuwara Eliya', created_at: isoDT(today) },
    { id: 5, name: 'Chaminda Jayasuriya', phone: '0799900005', nic: '803334445V', address: '25 Marine Dr, Matara', route: 'Matara', created_at: dtYearsAgo(3) }
  ],
  ac_units: [
    { id: 1, customer_id: 1, model: 'FTKF35', brand: 'Daikin', serial_indoor: 'IN-SK-001', serial_outdoor: 'OUT-SK-001', install_notes: 'Living room' },
    { id: 2, customer_id: 2, model: 'MSZ-AP', brand: 'Mitsubishi', serial_indoor: 'IN-DP-002', serial_outdoor: 'OUT-DP-002', install_notes: 'Master Bedroom' },
    { id: 3, customer_id: 3, model: 'Inverter-X', brand: 'LG', serial_indoor: 'IN-RF-003', serial_outdoor: 'OUT-RF-003', install_notes: 'Main Hall' },
    { id: 4, customer_id: 4, model: 'AR12', brand: 'Samsung', serial_indoor: 'IN-NS-004', serial_outdoor: 'OUT-NS-004', install_notes: 'Office' },
    { id: 5, customer_id: 5, model: 'FTKF50', brand: 'Daikin', serial_indoor: 'IN-CJ-005A', serial_outdoor: 'OUT-CJ-005A', install_notes: 'Living room' },
    { id: 6, customer_id: 5, model: 'MSZ-HR', brand: 'Mitsubishi', serial_indoor: 'IN-CJ-005B', serial_outdoor: 'OUT-CJ-005B', install_notes: 'Bedroom' }
  ],
  agreements: [
    { id: 1, agreement_no: 'AS-00001', customer_id: 1, ac_unit_id: 1, normal_count: 2, hp_count: 2, period_days: 90, price: 17000.00, start_date: addDays(0), end_date: addDays(365), amount_paid: 17000.00, status: 'active', parent_agreement_id: null, created_by: 1, created_at: isoDT(today) },
    { id: 2, agreement_no: 'AS-00002', customer_id: 2, ac_unit_id: 2, normal_count: 3, hp_count: 1, period_days: 90, price: 15500.00, start_date: addDays(-5), end_date: addDays(360), amount_paid: 15500.00, status: 'active', parent_agreement_id: null, created_by: 1, created_at: isoDT(today) },
    { id: 3, agreement_no: 'AS-00003', customer_id: 3, ac_unit_id: 3, normal_count: 2, hp_count: 2, period_days: 90, price: 17000.00, start_date: addDays(-30), end_date: addDays(335), amount_paid: 17000.00, status: 'active', parent_agreement_id: null, created_by: 1, created_at: isoDT(today) },
    { id: 4, agreement_no: 'AS-00004', customer_id: 4, ac_unit_id: 4, normal_count: 2, hp_count: 2, period_days: 90, price: 17000.00, start_date: addDays(-40), end_date: addDays(325), amount_paid: 17000.00, status: 'active', parent_agreement_id: null, created_by: 1, created_at: isoDT(today) },
    { id: 5, agreement_no: 'AS-00005', customer_id: 5, ac_unit_id: 5, normal_count: 2, hp_count: 2, period_days: 90, price: 17000.00, start_date: dateYearsAgo(1), end_date: addDays(-5), amount_paid: 17000.00, status: 'renewed', parent_agreement_id: null, created_by: 1, created_at: dtYearsAgo(1) },
    { id: 6, agreement_no: 'AS-00006', customer_id: 5, ac_unit_id: 5, normal_count: 2, hp_count: 2, period_days: 90, price: 17000.00, start_date: addDays(-4), end_date: addDays(361), amount_paid: 17000.00, status: 'active', parent_agreement_id: 5, created_by: 1, created_at: isoDT(today) },
    { id: 7, agreement_no: 'AS-00007', customer_id: 5, ac_unit_id: 6, normal_count: 1, hp_count: 1, period_days: 120, price: 8500.00, start_date: addDays(-60), end_date: addDays(305), amount_paid: 8500.00, status: 'cancelled', parent_agreement_id: null, created_by: 1, created_at: isoDT(today) }
  ],
  jobs: [
    // Agreement 1
    { id: 1, agreement_id: 1, scheduled_date: addDays(0), status: 'scheduled', technician_id: null, service_type_used: null, admin_confirmed: false, is_deleted: false, postponed_from: null, postpone_days: null, postpone_reason: null, cancel_reason: null, comments: null, completed_at: null, created_at: isoDT(today) },
    { id: 2, agreement_id: 1, scheduled_date: addDays(90), status: 'scheduled', technician_id: null, service_type_used: null, admin_confirmed: false, is_deleted: false, postponed_from: null, postpone_days: null, postpone_reason: null, cancel_reason: null, comments: null, completed_at: null, created_at: isoDT(today) },
    { id: 3, agreement_id: 1, scheduled_date: addDays(180), status: 'scheduled', technician_id: null, service_type_used: null, admin_confirmed: false, is_deleted: false, postponed_from: null, postpone_days: null, postpone_reason: null, cancel_reason: null, comments: null, completed_at: null, created_at: isoDT(today) },
    { id: 4, agreement_id: 1, scheduled_date: addDays(270), status: 'scheduled', technician_id: null, service_type_used: null, admin_confirmed: false, is_deleted: false, postponed_from: null, postpone_days: null, postpone_reason: null, cancel_reason: null, comments: null, completed_at: null, created_at: isoDT(today) },
    // Agreement 2
    { id: 5, agreement_id: 2, scheduled_date: addDays(0), status: 'in_progress', technician_id: 3, service_type_used: 'normal', admin_confirmed: false, is_deleted: false, postponed_from: null, postpone_days: null, postpone_reason: null, cancel_reason: null, comments: 'Technician on site servicing unit.', completed_at: null, created_at: isoDT(today) },
    { id: 6, agreement_id: 2, scheduled_date: addDays(90), status: 'scheduled', technician_id: 3, service_type_used: null, admin_confirmed: false, is_deleted: false, postponed_from: null, postpone_days: null, postpone_reason: null, cancel_reason: null, comments: null, completed_at: null, created_at: isoDT(today) },
    // Agreement 3
    { id: 7, agreement_id: 3, scheduled_date: addDays(-1), status: 'completed', technician_id: 4, service_type_used: 'normal', admin_confirmed: false, is_deleted: false, postponed_from: null, postpone_days: null, postpone_reason: null, cancel_reason: null, comments: 'Cleaned filters, gas pressure ok.', completed_at: dtDaysAgo(1), created_at: isoDT(today) },
    { id: 8, agreement_id: 3, scheduled_date: addDays(60), status: 'scheduled', technician_id: 4, service_type_used: null, admin_confirmed: false, is_deleted: false, postponed_from: null, postpone_days: null, postpone_reason: null, cancel_reason: null, comments: null, completed_at: null, created_at: isoDT(today) },
    // Agreement 4
    { id: 9, agreement_id: 4, scheduled_date: addDays(-8), status: 'completed', technician_id: 3, service_type_used: 'hp', admin_confirmed: true, is_deleted: false, postponed_from: null, postpone_days: null, postpone_reason: null, cancel_reason: null, comments: 'H/P service completed successfully.', completed_at: dtDaysAgo(8), created_at: isoDT(today) },
    { id: 10, agreement_id: 4, scheduled_date: addDays(12), status: 'postponed', technician_id: 3, service_type_used: null, admin_confirmed: false, is_deleted: false, postponed_from: addDays(2), postpone_days: 10, postpone_reason: 'Customer not available on original date', cancel_reason: null, comments: null, completed_at: null, created_at: isoDT(today) },
    // Agreement 6 & 7
    { id: 11, agreement_id: 6, scheduled_date: addDays(20), status: 'scheduled', technician_id: 3, service_type_used: null, admin_confirmed: false, is_deleted: false, postponed_from: null, postpone_days: null, postpone_reason: null, cancel_reason: null, comments: null, completed_at: null, created_at: isoDT(today) },
    { id: 12, agreement_id: 6, scheduled_date: addDays(200), status: 'scheduled', technician_id: null, service_type_used: null, admin_confirmed: false, is_deleted: true, postponed_from: null, postpone_days: null, postpone_reason: null, cancel_reason: null, comments: 'Created in error — soft deleted.', completed_at: null, created_at: isoDT(today) },
    { id: 13, agreement_id: 7, scheduled_date: addDays(15), status: 'cancelled', technician_id: null, service_type_used: null, admin_confirmed: false, is_deleted: false, postponed_from: null, postpone_days: null, postpone_reason: null, cancel_reason: 'Customer moved out of service area', comments: null, completed_at: null, created_at: isoDT(today) }
  ],
  job_photos: [
    { id: 1, job_id: 5, photo_path: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop', uploaded_at: isoDT(today), uploaded_by: 3 },
    { id: 2, job_id: 5, photo_path: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=500&auto=format&fit=crop', uploaded_at: isoDT(today), uploaded_by: 3 },
    { id: 3, job_id: 7, photo_path: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop', uploaded_at: dtDaysAgo(1), uploaded_by: 4 },
    { id: 4, job_id: 7, photo_path: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=500&auto=format&fit=crop', uploaded_at: dtDaysAgo(1), uploaded_by: 4 }
  ],
  sms_templates: [
    { id: 1, template_type: 'activation', body: 'Dear {name}, your Highcool AC service agreement {agreementNo} is active. Welcome!', updated_at: isoDT(today) },
    { id: 2, template_type: 'reminder', body: 'Reminder: Highcool technician visit scheduled tomorrow for agreement {agreementNo}.', updated_at: isoDT(today) },
    { id: 3, template_type: 'completion', body: 'Dear {name}, your AC servicing for agreement {agreementNo} is completed. Thank you!', updated_at: isoDT(today) }
  ],
  sms_logs: [
    { id: 1, customer_id: 1, job_id: 1, template_type: 'activation', message: 'Dear Saman Kumara, your Highcool AC service agreement AS-00001 is active. Welcome!', sent_at: isoDT(today), status: 'sent' },
    { id: 2, customer_id: 4, job_id: 9, template_type: 'completion', message: 'Dear Nadeesha Silva, your AC servicing for agreement AS-00004 is completed. Thank you!', sent_at: dtDaysAgo(8), status: 'sent' }
  ]
};

export function getDB() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeed));
    return defaultSeed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeed));
    return defaultSeed;
  }
}

export function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetDB() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeed));
  return defaultSeed;
}
