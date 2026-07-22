import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from './auth/AuthContext';
import { pageVariants } from './lib/motion';
import Layout from './components/Layout';
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

const office = ['admin', 'system_user'];

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <Routes location={location}>
          <Route path="/dashboard" element={<ProtectedRoute roles={office}><Dashboard /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute roles={office}><CustomerSearch /></ProtectedRoute>} />
          <Route path="/customers/:id" element={<ProtectedRoute roles={office}><CustomerProfile /></ProtectedRoute>} />
          <Route path="/agreements/new" element={<ProtectedRoute roles={office}><NewAgreement /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute roles={office}><Calendar /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute roles={office}><JobSlot /></ProtectedRoute>} />
          <Route path="/cancellations" element={<ProtectedRoute roles={office}><JobCancellations /></ProtectedRoute>} />
          <Route path="/deleted-jobs" element={<ProtectedRoute roles={office}><DeletedJobs /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['admin']}><AddUsers /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute roles={['admin']}><AddPrice /></ProtectedRoute>} />
          <Route path="/technician" element={<ProtectedRoute roles={['technician']}><TechHome /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  void user;
  return (
    <Layout>
      <AnimatedRoutes />
    </Layout>
  );
}
