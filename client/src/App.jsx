import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import AddUsers from './pages/admin/AddUsers';
import AddPrice from './pages/admin/AddPrice';
import CustomerSearch from './pages/admin/CustomerSearch';
import CustomerProfile from './pages/admin/CustomerProfile';
import NewAgreement from './pages/admin/NewAgreement';
import Calendar from './pages/admin/Calendar';
import JobSlot from './pages/admin/JobSlot';
import DeletedJobs from './pages/admin/DeletedJobs';
import JobCancellations from './pages/admin/JobCancellations';
import TechHome from './pages/technician/TechHome';

function Nav() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  if (!isAuthenticated) return null;

  const isAdmin = user.role === 'admin';
  const isTech = user.role === 'technician';

  return (
    <nav className="nav">
      <span className="nav-brand">Highcool Service Hub</span>
      <div className="nav-links">
        {!isTech && <Link to="/dashboard">Dashboard</Link>}
        {!isTech && <Link to="/customers">Customers</Link>}
        {!isTech && <Link to="/agreements/new">New Agreement</Link>}
        {!isTech && <Link to="/calendar">Calendar</Link>}
        {!isTech && <Link to="/cancellations">Cancellations</Link>}
        {!isTech && <Link to="/deleted-jobs">Deleted</Link>}
        {isAdmin && <Link to="/users">Users</Link>}
        {isAdmin && <Link to="/pricing">Pricing</Link>}
        {isTech && <Link to="/technician">My Jobs</Link>}
      </div>
      <div className="nav-user">
        <span>{user.name} ({user.role})</span>
        <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute roles={['admin', 'system_user']}><Dashboard /></ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute roles={['admin', 'system_user']}><CustomerSearch /></ProtectedRoute>
          } />
          <Route path="/customers/:id" element={
            <ProtectedRoute roles={['admin', 'system_user']}><CustomerProfile /></ProtectedRoute>
          } />
          <Route path="/agreements/new" element={
            <ProtectedRoute roles={['admin', 'system_user']}><NewAgreement /></ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute roles={['admin', 'system_user']}><Calendar /></ProtectedRoute>
          } />
          <Route path="/jobs/:id" element={
            <ProtectedRoute roles={['admin', 'system_user']}><JobSlot /></ProtectedRoute>
          } />
          <Route path="/cancellations" element={
            <ProtectedRoute roles={['admin', 'system_user']}><JobCancellations /></ProtectedRoute>
          } />
          <Route path="/deleted-jobs" element={
            <ProtectedRoute roles={['admin', 'system_user']}><DeletedJobs /></ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['admin']}><AddUsers /></ProtectedRoute>
          } />
          <Route path="/pricing" element={
            <ProtectedRoute roles={['admin']}><AddPrice /></ProtectedRoute>
          } />
          <Route path="/technician" element={
            <ProtectedRoute roles={['technician']}><TechHome /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </>
  );
}
