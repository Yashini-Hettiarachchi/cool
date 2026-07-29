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
import Assignments from './pages/admin/Assignments';
import CompleteRequests from './pages/admin/CompleteRequests';
import JobSlot from './pages/admin/JobSlot';
import SmsCentre from './pages/admin/SmsCentre';
import JobCard from './pages/JobCard';
import DeletedJobs from './pages/admin/DeletedJobs';
import JobCancellations from './pages/admin/JobCancellations';
import TodayJobs from './pages/technician/TodayJobs';
import JobSearch from './pages/technician/JobSearch';
import JobDetail from './pages/technician/JobDetail';

const office = ['admin', 'system_user'];

function AnimatedRoutes({ home }) {
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
          <Route path="/assignments" element={<ProtectedRoute roles={office}><Assignments /></ProtectedRoute>} />
          <Route path="/complete-requests" element={<ProtectedRoute roles={office}><CompleteRequests /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute roles={office}><JobSlot /></ProtectedRoute>} />
          {/* Job card is printed by office staff AND by technicians on site, so it
              is the one page shared by all three roles. The API still enforces
              that a technician may only open a job assigned to them. */}
          <Route path="/jobs/:id/card" element={<ProtectedRoute roles={[...office, 'technician']}><JobCard /></ProtectedRoute>} />
          <Route path="/sms" element={<ProtectedRoute roles={office}><SmsCentre /></ProtectedRoute>} />
          <Route path="/cancellations" element={<ProtectedRoute roles={office}><JobCancellations /></ProtectedRoute>} />
          <Route path="/deleted-jobs" element={<ProtectedRoute roles={office}><DeletedJobs /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['admin']}><AddUsers /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute roles={['admin']}><AddPrice /></ProtectedRoute>} />
          <Route path="/technician" element={<ProtectedRoute roles={['technician']}><TodayJobs /></ProtectedRoute>} />
          <Route path="/technician/search" element={<ProtectedRoute roles={['technician']}><JobSearch /></ProtectedRoute>} />
          <Route path="/technician/jobs/:id" element={<ProtectedRoute roles={['technician']}><JobDetail /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={home} replace />} />
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

  const home = user?.role === 'technician' ? '/technician' : '/dashboard';
  return (
    <Layout>
      <AnimatedRoutes home={home} />
    </Layout>
  );
}
