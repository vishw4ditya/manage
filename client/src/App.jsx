import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import PendingPage from './pages/PendingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OwnerDashboard from './pages/OwnerDashboard';
import RMDashboard from './pages/RMDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import SalesmanDashboard from './pages/SalesmanDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map = {
    OWNER: '/dashboard/owner',
    REGIONAL_MANAGER: '/dashboard/rm',
    MANAGER: '/dashboard/manager',
    SALESMAN: '/dashboard/salesman',
    TECHNICIAN: '/dashboard/technician',
  };
  return <Navigate to={map[user.role] || '/login'} replace />;
}

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<RoleRedirect />} />
          <Route
            path="/dashboard/owner"
            element={
              <ProtectedRoute requiredRole="OWNER">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/rm"
            element={
              <ProtectedRoute requiredRole="REGIONAL_MANAGER">
                <RMDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/manager"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/salesman"
            element={
              <ProtectedRoute requiredRole="SALESMAN">
                <SalesmanDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/technician"
            element={
              <ProtectedRoute requiredRole="TECHNICIAN">
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
