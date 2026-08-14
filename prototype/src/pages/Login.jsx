import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user.role === 'technician') navigate('/technician');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-mark">H</div>
          <span style={{ fontSize: 20, fontWeight: 700 }}>Highcool Service Hub</span>
        </div>
        <div>
          <h1>AC Service Management</h1>
          <p>1-Year Agreements, Service Scheduling, Technician Photo Proof & Automated Reminders.</p>
        </div>
        <div className="feat">
          <span>Demo Credentials: <b>admin / admin123</b> or <b>tech_kamal / tech123</b></span>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <h1 style={{ marginBottom: 6 }}>Sign In</h1>
          <p className="muted" style={{ marginTop: 0, marginBottom: 24 }}>Enter your credentials to access the system.</p>

          {error && <div className="form-note" style={{ background: '#fdeaee', color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <span className="field-label">Username</span>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="e.g. admin" />
            </div>
            <div className="field">
              <span className="field-label">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn block" style={{ width: '100%', marginTop: 10 }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 13 }}>
            <strong>Quick Demo Logins:</strong>
            <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
              <button type="button" className="btn secondary sm" onClick={() => { setUsername('admin'); setPassword('admin123'); }}>Admin</button>
              <button type="button" className="btn secondary sm" onClick={() => { setUsername('tech_kamal'); setPassword('tech123'); }}>Technician</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
