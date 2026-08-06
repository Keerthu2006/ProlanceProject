import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = {
  OWNER: [
    { to: '/owner',                     icon: '🏠', label: 'Overview',          end: true },
    { to: '/owner/recommendations',     icon: '🤖', label: 'AI Recommendations' },
    { to: '/owner/automation',          icon: '⚡', label: 'Automation Log'     },
    { to: '/owner/events',              icon: '📡', label: 'Event Feed'         },
    { to: '/owner/revenue',             icon: '💰', label: 'Revenue'            },
    { to: '/owner/freelancers',         icon: '👥', label: 'Browse Freelancers' },
  ],
  CLIENT: [
    { to: '/client',                    icon: '🏠', label: 'Dashboard',         end: true },
    { to: '/client/post-project',       icon: '➕', label: 'Post Project'       },
    { to: '/client/projects',           icon: '📋', label: 'My Projects'        },
    { to: '/client/browse-freelancers', icon: '👥', label: 'Browse Freelancers' },
  ],
  FREELANCER: [
    { to: '/freelancer',                icon: '🏠', label: 'Dashboard',         end: true },
    { to: '/freelancer/browse',         icon: '🔍', label: 'Browse Projects'    },
    { to: '/freelancer/applications',   icon: '📨', label: 'My Applications'    },
    { to: '/freelancer/profile',        icon: '👤', label: 'My Profile'         },
    { to: '/freelancer/teams',          icon: '🤝', label: 'Teams'              },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = LINKS[user?.role] ?? [];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-name">TriGrowth AI</div>
        <div className="logo-sub">TeamLance Platform</div>
      </div>

      <nav>
        {links.map(({ to, icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => isActive ? 'active' : ''}>
            <span>{icon}</span> {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-name">{user?.fullName}</div>
        <div className="sidebar-user-role">{user?.role}</div>
        <button className="btn btn-ghost btn-sm w-full"
          style={{ color: '#9ca3af', borderColor: '#374151' }}
          onClick={() => { logout(); navigate('/login'); }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}