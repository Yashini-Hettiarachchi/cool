import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * Frontend route guard (UX only — real enforcement is the backend JWT/role check).
 * Redirects unauthenticated users to /login and wrong-role users to their home.
 */
export default function ProtectedRoute({ roles, children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    const home = user.role === 'technician' ? '/technician' : '/dashboard';
    return <Navigate to={home} replace />;
  }

  return children;
}
