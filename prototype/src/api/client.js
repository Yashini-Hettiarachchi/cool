let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export const api = {
  get: async (path) => ({ ok: true }),
  post: async (path, body) => ({ ok: true }),
  put: async (path, body) => ({ ok: true }),
  patch: async (path, body) => ({ ok: true }),
  del: async (path) => ({ ok: true }),
  postForm: async (path, formData) => ({ ok: true }),
};
