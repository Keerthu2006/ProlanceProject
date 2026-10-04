import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

/* ── Pages ── */
import HomePage from './pages/HomePage';
import AuthPages from './pages/auth/AuthPages';
import ClientRegistration from './pages/auth/ClientRegistration';
import FreelancerOnboarding from './pages/auth/FreelancerOnboarding';

/* ── Dashboard Layout ── */
import DashboardLayout from './layouts/DashboardLayout';

/* ── Dashboard Pages ── */
import ClientDashboard from './pages/dashboard/ClientDashboard';
import FreelancerDashboard from './pages/dashboard/FreelancerDashboard';
import OwnerDashboard from './pages/dashboard/OwnerDashboard';
import AIDashboard from './pages/dashboard/AIDashboard';
import AISuggestionsPage from './pages/dashboard/AISuggestionsPage';
import MarketIntelligencePage from './pages/dashboard/MarketIntelligencePage';
import CreateProject from './pages/dashboard/CreateProject';
import ProjectDetail from './pages/dashboard/ProjectDetail';
import BrowseProjects from './pages/dashboard/BrowseProjects';
import ContractsPage from './pages/dashboard/ContractsPage';
import MilestonesPage from './pages/dashboard/MilestonesPage';
import TeamsPage from './pages/dashboard/TeamsPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import ReviewsPage from './pages/dashboard/ReviewsPage';
import SkillDevelopment from './pages/dashboard/SkillDevelopment';
import AutomationMonitor from './pages/dashboard/AutomationMonitor';
import SystemHealth from './pages/dashboard/SystemHealth';
import ReportsPage from './pages/dashboard/ReportsPage';
import NeglectDashboard from './pages/dashboard/NeglectDashboard';
import PaymentPage from './pages/PaymentPage';

/* ── AI Chat ── */
import AIChatAssistant from './components/AIChatAssistant';

/* ── Page transition ── */
const pageVariants = {
  initial:  { opacity: 0, y: 12 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:     { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: '100%', minHeight: '100vh' }}
      >
        <Routes location={location}>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPages />} />
          <Route path="/register" element={<AuthPages initialRegister />} />
          <Route path="/register/client" element={<ClientRegistration />} />
          <Route path="/register/freelancer" element={<FreelancerOnboarding />} />
          <Route path="/onboarding" element={<FreelancerOnboarding />} />
          <Route path="/auth/oauth2/success" element={<OAuthCallback />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardRedirect />} />
            <Route path="client" element={<ClientDashboard />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="freelancer" element={<FreelancerDashboard />} />
            <Route path="admin" element={<ProtectedRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><OwnerDashboard /></ProtectedRoute>} />
            <Route path="owner" element={<ProtectedRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><OwnerDashboard /></ProtectedRoute>} />
            <Route path="admin-ai" element={<ProtectedRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><AIDashboard /></ProtectedRoute>} />
            <Route path="ai" element={<AISuggestionsPage />} />
            <Route path="market-intel" element={<MarketIntelligencePage />} />
            <Route path="neglect" element={<ProtectedRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><NeglectDashboard /></ProtectedRoute>} />
            <Route path="create-project" element={<CreateProject />} />
            <Route path="project/:id" element={<ProjectDetail />} />
            <Route path="browse-projects" element={<BrowseProjects />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="milestones" element={<MilestonesPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="skills" element={<SkillDevelopment />} />
            <Route path="automation" element={<ProtectedRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><AutomationMonitor /></ProtectedRoute>} />
            <Route path="system-health" element={<ProtectedRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><SystemHealth /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><ReportsPage /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'ROLE_CLIENT') return <Navigate to="/dashboard/client" replace />;
  if (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_OWNER') return <Navigate to="/dashboard/admin" replace />;
  return <Navigate to="/dashboard/freelancer" replace />;
}

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const roleFromUrl = searchParams.get('role');
  const { login } = useAuth();

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    try {
      // Decode JWT payload (Base64URL safe)
      const base64Url = token.split('.')[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      let jsonPayload;
      try {
        jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      } catch {
        jsonPayload = atob(base64);
      }
      const payload = JSON.parse(jsonPayload);
      const role = payload.role || roleFromUrl || 'ROLE_FREELANCER';
      const userData = {
        email: payload.sub,
        role,
        fullName: payload.name || payload.sub?.split('@')[0] || 'User',
      };
      // Log in directly — NO OTP for Google Sign-In
      login(token, userData);
      if (role === 'ROLE_CLIENT') { window.location.href = '/dashboard/client'; return; }
      if (role === 'ROLE_OWNER' || role === 'ROLE_ADMIN') { window.location.href = '/dashboard/admin'; return; }
      window.location.href = '/dashboard/freelancer';
    } catch (err) {
      console.error('Google auth error:', err);
      window.location.href = '/login?error=auth_failed';
    }
  }, [token, roleFromUrl]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0A07' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#997E67', margin: '0 auto 1rem', animation: 'pulse 1.5s infinite' }} />
        <p style={{ color: '#FFDBBB', fontSize: 16 }}>Signing you in with Google...</p>
      </div>
    </div>
  );
}




function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ROLE_CLIENT') return <Navigate to="/dashboard/client" replace />;
    if (user.role === 'ROLE_OWNER' || user.role === 'ROLE_ADMIN') return <Navigate to="/dashboard/admin" replace />;
    return <Navigate to="/dashboard/freelancer" replace />;
  }
  return children;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('teamlance-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.background = theme === 'dark' ? '#0D0A07' : '#FAF7F4';
    document.body.style.color = theme === 'dark' ? '#FFDBBB' : '#2C1810';
    document.body.style.margin = '0';
    document.body.style.fontFamily = "'Inter','Segoe UI',sans-serif";
    localStorage.setItem('prolance-theme', theme);
  }, [theme]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" theme="dark" />
        <AnimatedRoutes />
        <AIChatAssistant />
      </BrowserRouter>
    </AuthProvider>
  );
}

