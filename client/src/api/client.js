/**
 * Thin fetch wrapper. Holds the JWT in a module-scoped variable (memory only,
 * not localStorage) per the design plan, and attaches it to every request.
 */
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Multipart POST (file uploads). Lets the browser set the Content-Type boundary. */
async function postForm(path, formData) {
  const headers = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`/api${path}`, { method: 'POST', headers, body: formData });

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = { error: text }; }
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
  postForm,
};

/** Auth header for <img> src — returns the token so callers can build authenticated fetches. */
export { postForm };
