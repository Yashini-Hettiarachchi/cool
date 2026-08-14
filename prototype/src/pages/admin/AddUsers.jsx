import { useEffect, useState } from 'react';
import { usersApi } from '../../api/users.api';
import { PageHead } from '../../components/ui';

export default function AddUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('technician');
  const [password, setPassword] = useState('user123');

  const loadData = () => {
    usersApi.list()
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await usersApi.create({ name, username, phone, role, password });
    setName('');
    setUsername('');
    setPhone('');
    loadData();
  };

  const handleToggle = async (id, currentActive) => {
    await usersApi.toggleActive(id, !currentActive);
    loadData();
  };

  return (
    <div>
      <PageHead
        title="User & Technician Management"
        sub="Manage system users, administrators, and field technicians."
      />

      <div className="card">
        <h2>Create New User / Technician</h2>
        <form onSubmit={handleCreate} className="form-grid">
          <div className="field"><label>Full Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Sunil Perera" /></div>
          <div className="field"><label>Username *</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="sunil_tech" /></div>
          <div className="field"><label>Phone Number</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0771234567" /></div>
          <div className="field">
            <label>Role *</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="technician">Technician</option>
              <option value="system_user">System User (Office)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div className="field"><label>Password *</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <div className="form-actions span-2">
            <button type="submit" className="btn primary">+ Create User Account</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Registered System Users ({users.length})</h2>
        {loading ? <div className="muted">Loading users...</div> : (
          <table className="table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={!u.active ? 'row-inactive' : ''}>
                  <td className="mono">#{u.id}</td>
                  <td><strong>{u.name}</strong></td>
                  <td className="mono">{u.username}</td>
                  <td className="mono">{u.phone || '—'}</td>
                  <td><span className="pill tone-brand">{u.role}</span></td>
                  <td><span className={`badge-soft ${u.active ? 'st-completed' : 'st-cancelled'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="btn secondary sm" onClick={() => handleToggle(u.id, u.active)}>
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
