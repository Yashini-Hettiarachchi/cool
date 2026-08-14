import { getDB, saveDB } from './mockStore';

export const usersApi = {
  list: async () => {
    const db = getDB();
    return db.users.map(({ password, ...u }) => u);
  },
  create: async (userData) => {
    const db = getDB();
    const newId = Math.max(...db.users.map(u => u.id), 0) + 1;
    const user = { id: newId, ...userData, active: true, password: userData.password || 'user123' };
    db.users.push(user);
    saveDB(db);
    const { password, ...safeUser } = user;
    return safeUser;
  },
  toggleActive: async (id, active) => {
    const db = getDB();
    const user = db.users.find(u => u.id === Number(id));
    if (user) {
      user.active = active;
      saveDB(db);
    }
    return { ok: true };
  }
};
