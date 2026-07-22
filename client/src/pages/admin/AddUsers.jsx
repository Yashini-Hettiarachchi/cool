import { useEffect, useState } from 'react';
import { usersApi } from '../../api/users.api';

const EMPTY = { name: '', username: '', phone: '', role: 'technician', password: '' };

export default function AddUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const { users } = await usersApi.list();
      setUsers(users);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(u) {
    setEditingId(u.id);
    setForm({ name: u.name, username: u.username || '', phone: u.phone || '', role: u.role, password: '' });
    setNotice('');
    setError('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (editingId) {
        const payload = { name: form.name, username: form.username, phone: form.phone, role: form.role };
        if (form.password) payload.password = form.password;
        await usersApi.update(editingId, payload);
        setNotice('User updated.');
      } else {
        await usersApi.create(form);
        setNotice('User created.');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivate(id) {
    setError('');
    setNotice('');
    try {
      await usersApi.deactivate(id);
      setNotice('User deactivated.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h1>Users</h1>
      <p className="muted">Add, update, or deactivate System User and Technician accounts.</p>

      <form onSubmit={handleSubmit} className="form-grid">
        <label className="field">
          <span className="field-label">Name <b className="req">*</b></span>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Kamal Perera" required />
        </label>
        <label className="field">
          <span className="field-label">Username <b className="req">*</b></span>
          <input value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="Used to log in" autoComplete="off" required />
        </label>
        <label className="field">
          <span className="field-label">Phone</span>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Contact number (optional)" />
        </label>
        <label className="field">
          <span className="field-label">Role</span>
          <select value={form.role} onChange={(e) => set('role', e.target.value)}>
            <option value="technician">Technician</option>
            <option value="system_user">System User</option>
          </select>
        </label>
        <label className="field span-2">
          <span className="field-label">Password {editingId ? <span className="hint">— leave blank to keep current</span> : <b className="req">*</b>}</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder={editingId ? '••••••••' : 'Set a password'}
            required={!editingId}
          />
        </label>

        {error && <p className="error">{error}</p>}
        {notice && <p className="notice">{notice}</p>}

        <div className="form-actions">
          <button type="submit" disabled={busy}>
            {editingId ? 'Update user' : '+ Add user'}
          </button>
          {editingId && <button type="button" className="secondary" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <table className="table">
        <thead>
          <tr><th>Name</th><th>Username</th><th>Phone</th><th>Role</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className={u.active ? '' : 'row-inactive'}>
              <td>{u.name}</td>
              <td>{u.username}</td>
              <td>{u.phone}</td>
              <td>{u.role}</td>
              <td>{u.active ? 'Active' : 'Inactive'}</td>
              <td className="row-actions">
                {u.role !== 'admin' && (
                  <>
                    <button className="link" onClick={() => startEdit(u)}>Edit</button>
                    {u.active && <button className="link danger" onClick={() => handleDeactivate(u.id)}>Deactivate</button>}
                  </>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan="6" className="muted">No users yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
