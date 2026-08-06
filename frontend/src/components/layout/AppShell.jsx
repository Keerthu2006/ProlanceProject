import { useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useDashboardSocket } from '../../websocket/socket';
import { useToast } from '../../hooks/useToast';

export default function AppShell() {
  const { user } = useAuth();
  const { toast, show: showToast } = useToast();
  const isOwner = user?.role === 'OWNER';

  useDashboardSocket({
    enabled: isOwner,
    onAlert: useCallback((p) =>
      showToast(`🤖 AI [${p.agent}] ${p.severity} — ${(p.summary ?? '').substring(0, 80)}`),
    [showToast]),
    onAutomation: useCallback((p) =>
      showToast(`⚡ Automation [${p.actionType}] → ${p.status}`),
    [showToast]),
  });

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">

        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-brand">
            {isOwner && <><span className="live-dot" />&nbsp;TriGrowth AI — Live</>}
            {user?.role === 'CLIENT'     && '👋 Client Portal'}
            {user?.role === 'FREELANCER' && '💻 Freelancer Portal'}
          </div>
          <div className="topbar-user">
            <span style={{ fontWeight: 600 }}>{user?.fullName}</span>
            <span className={`badge badge-${user?.role?.toLowerCase()}`}>{user?.role}</span>
          </div>
        </div>

        {/* Page content injected here */}
        <Outlet />
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}