import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { usersApi } from '../../api/users.api';
import { tap } from '../../lib/motion';
import { PageHeader, Avatar, Pill, EmptyState, Alert, rowContainer, rowItem } from '../../components/ui';
import Pagination, { paginate } from '../../components/Pagination';

const ROLE_LABEL = { admin: 'Admin', system_user: 'System User', technician: 'Technician' };
const ROLE_TONE = { admin: 'brand', system_user: 'blue', technician: 'muted' };

const EMPTY = { name: '', username: '', phone: '', role: 'technician', password: '' };

export default function AddUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);

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
      <PageHeader icon="users" title="Users" subtitle="Add, update, or deactivate System User and Technician accounts." />

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

        <Alert tone="error">{error}</Alert>
        <Alert tone="ok">{notice}</Alert>

        <div className="form-actions">
          <motion.button {...tap} type="submit" disabled={busy}>
            {busy ? 'Saving…' : editingId ? 'Update user' : '+ Add user'}
          </motion.button>
          {editingId && <motion.button {...tap} type="button" className="secondary" onClick={resetForm}>Cancel</motion.button>}
        </div>
      </form>

      {users.length === 0 ? (
        <EmptyState icon="users" title="No users yet" hint="Add your first System User or Technician using the form above." />
      ) : (() => {
        const pg = paginate(users, page, 12);
        return (
        <>
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Username</th><th>Phone</th><th>Role</th><th>Status</th><th></th></tr>
          </thead>
          <motion.tbody variants={rowContainer} initial="hidden" animate="visible">
            {pg.slice.map((u) => (
              <motion.tr key={u.id} variants={rowItem} className={u.active ? '' : 'row-inactive'}>
                <td>
                  <span className="name-cell">
                    <Avatar name={u.name} size={34} />
                    <span className="nc-main">{u.name}</span>
                  </span>
                </td>
                <td className="mono">{u.username}</td>
                <td>{u.phone || '—'}</td>
                <td><Pill tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role] || u.role}</Pill></td>
                <td><Pill tone={u.active ? 'green' : 'muted'}>{u.active ? 'Active' : 'Inactive'}</Pill></td>
                <td className="row-actions">
                  {u.role !== 'admin' && (
                    <>
                      <button className="link" onClick={() => startEdit(u)}>Edit</button>
                      {u.active && <button className="link danger" onClick={() => handleDeactivate(u.id)}>Deactivate</button>}
                    </>
                  )}
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
        <Pagination {...pg} onPage={setPage} unit="users" />
        </>
        );
      })()}
    </div>
  );
}
