import { useAuth } from '../../auth/AuthContext';

/**
 * Placeholder dashboard for Phase 1 — confirms role-based routing works.
 * Real widgets (calendar, complete-requests, search) arrive in later phases.
 */
export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="card">
      <h1>Dashboard</h1>
      <p>Welcome, <strong>{user.name}</strong>. You are signed in as <strong>{user.role}</strong>.</p>
      <p className="muted">
        Customer search, calendar, and job management arrive in Phase 2+. For now, this
        screen confirms authentication and role routing are working.
      </p>
      {user.role === 'admin' && (
        <ul>
          <li>Manage <strong>Users</strong> and <strong>Pricing</strong> from the top navigation.</li>
        </ul>
      )}
    </div>
  );
}
