import { getDB, saveDB } from './mockStore';

export const customersApi = {
  search: async (query = '', page = 1, limit = 10) => {
    const db = getDB();
    const q = query.trim().toLowerCase();
    let filtered = db.customers;
    if (q) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.phone.includes(q) || 
        c.nic.toLowerCase().includes(q) || 
        (c.route && c.route.toLowerCase().includes(q))
      );
    }
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  },
  getProfile: async (id) => {
    const db = getDB();
    const customer = db.customers.find(c => c.id === Number(id));
    if (!customer) throw new Error('Customer not found');
    const acUnits = db.ac_units.filter(a => a.customer_id === customer.id);
    const agreements = db.agreements.filter(a => a.customer_id === customer.id);
    return { ...customer, acUnits, agreements };
  },
  create: async (data) => {
    const db = getDB();
    const newId = Math.max(...db.customers.map(c => c.id), 0) + 1;
    const customer = {
      id: newId,
      name: data.name,
      phone: data.phone,
      nic: data.nic,
      address: data.address || '',
      route: data.route || '',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    db.customers.unshift(customer);
    saveDB(db);
    return customer;
  }
};
