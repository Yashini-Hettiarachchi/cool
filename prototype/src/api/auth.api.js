import { getDB } from './mockStore';

export const authApi = {
  login: async (username, password) => {
    const db = getDB();
    const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.active);
    if (!user || user.password !== password) {
      const err = new Error('Invalid username or password');
      err.status = 401;
      throw err;
    }
    const token = `fake-jwt-token-${user.id}-${Date.now()}`;
    const userObj = { id: user.id, name: user.name, username: user.username, role: user.role };
    return { token, user: userObj };
  },
};
