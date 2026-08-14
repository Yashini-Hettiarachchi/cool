import { getDB, saveDB } from './mockStore';

export const pricingApi = {
  get: async () => {
    const db = getDB();
    return db.pricing;
  },
  update: async (serviceType, price) => {
    const db = getDB();
    const item = db.pricing.find(p => p.service_type === serviceType);
    if (item) {
      item.price = Number(price);
      item.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      saveDB(db);
    }
    return { ok: true };
  }
};
