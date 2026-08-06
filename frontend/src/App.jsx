import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
            <Route path="freelancer" element={<FreelancerDashboard />} />
            <Route path="admin" element={<OwnerDashboard />} />
            <Route path="owner" element={<OwnerDashboard />} />
            <Route path="ai" element={<AIDashboard />} />
            <Route path="market-intel" element={<MarketIntelligencePage />} />
            <Route path="neglect" element={<NeglectDashboard />} />
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
            <Route path="automation" element={<AutomationMonitor />} />
            <Route path="system-health" element={<SystemHealth />} />
            <Route path="reports" element={<ReportsPage />} />
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
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role || roleFromUrl || 'ROLE_FREELANCER';
        const userData = {
          email: payload.sub,
          role,
          fullName: payload.name || payload.sub?.split('@')[0] || 'User',
        };
        login(token, userData);
        if (role === 'ROLE_CLIENT') { window.location.href = '/dashboard/client'; return; }
        if (role === 'ROLE_OWNER' || role === 'ROLE_ADMIN') { window.location.href = '/dashboard/admin'; return; }
        window.location.href = '/dashboard/freelancer';
      } catch { window.location.href = '/login'; }
    } else {
      window.location.href = '/login';
    }
  }, [token, roleFromUrl, login]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="live-dot" style={{ width: 40, height: 40, margin: '0 auto 1rem' }} />
        <p className="text-muted">Signing you in to TeamLance…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
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
