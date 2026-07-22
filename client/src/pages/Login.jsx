import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../auth/AuthContext';
import { motionTokens } from '../lib/motion';

function Feature({ children }) {
  return (
    <div className="feat">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA2046" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(username.trim(), password);
      navigate(user.role === 'technician' ? '/technician' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <motion.div className="auth-hero"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <div className="brand-mark">H</div>
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: motionTokens.easing.smooth, delay: 0.05 }}>
            Keep every AC agreement on schedule.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: motionTokens.easing.smooth, delay: 0.12 }}>
            Agreements, scheduling, technician dispatch, and automated reminders — one hub for the whole service cycle.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}>
            <Feature>Auto-scheduled service visits with SMS reminders</Feature>
            <Feature>Technician job cards with photo proof</Feature>
            <Feature>Renewals & full customer history</Feature>
          </motion.div>
        </div>
        <div style={{ color: '#8b8f97', fontSize: 13 }}>© Highcool Service Hub</div>
      </motion.div>

      <div className="auth-panel">
        <motion.div className="auth-card"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: motionTokens.easing.smooth }}>
          <h1>Sign in</h1>
          <p className="muted" style={{ marginTop: 0, marginBottom: 24 }}>Enter your credentials to continue.</p>
          <form onSubmit={handleSubmit}>
            <label>
              Username
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="admin" required />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" required />
            </label>
            {error && <p className="error">{error}</p>}
            <motion.button type="submit" disabled={busy} style={{ width: '100%', marginTop: 8 }}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              {busy ? 'Signing in…' : 'Sign in'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
