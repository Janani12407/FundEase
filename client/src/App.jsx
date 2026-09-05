import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import RoleSwitcherBar from './components/RoleSwitcherBar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/Student/StudentDashboard';
import ApplicationWizard from './pages/Student/ApplicationWizard';
import ApplicationDetails from './pages/Student/ApplicationDetails';
import AdminDashboard from './pages/InstitutionAdmin/AdminDashboard';
import AuthorityDashboard from './pages/Authority/AuthorityDashboard';
import AuditorDashboard from './pages/Auditor/AuditorDashboard';
import AnalyticsDashboard from './pages/Analytics/AnalyticsDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
        Verifying security session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to respective home dashboard based on role
    if (user?.role === 'student') return <Navigate to="/student" replace />;
    if (user?.role === 'institution_admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'scholarship_authority') return <Navigate to="/authority" replace />;
    if (user?.role === 'auditor') return <Navigate to="/auditor" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="app-wrapper">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Student Routes */}
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/apply"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <ApplicationWizard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/application/:id"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'institution_admin', 'scholarship_authority', 'auditor']}>
                      <ApplicationDetails />
                    </ProtectedRoute>
                  }
                />

                {/* Institution Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['institution_admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Scholarship Authority Routes */}
                <Route
                  path="/authority"
                  element={
                    <ProtectedRoute allowedRoles={['scholarship_authority']}>
                      <AuthorityDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Auditor Routes */}
                <Route
                  path="/auditor"
                  element={
                    <ProtectedRoute allowedRoles={['auditor']}>
                      <AuditorDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Analytics Dashboard */}
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['institution_admin', 'scholarship_authority', 'auditor']}>
                      <AnalyticsDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Global Role Switcher for seamless demoing */}
            <RoleSwitcherBar />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
