import { useAuth } from '../../auth/AuthContext';

/** Placeholder technician home for Phase 1. Job search/photos come in Phase 4. */
export default function TechHome() {
  const { user } = useAuth();
  return (
    <div className="card">
      <h1>My Jobs</h1>
      <p>Signed in as <strong>{user.name}</strong> (technician).</p>
      <p className="muted">
        Today&apos;s jobs, AS- search, photo upload, and job completion arrive in Phase 4.
      </p>
    </div>
  );
}
