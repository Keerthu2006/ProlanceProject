import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyProjects } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { currency, timeAgo } from '../../utils/helpers';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getMyProjects().then(r => setProjects(r.data)).finally(() => setLoading(false));
  }, []);

  const counts = { OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
  projects.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1>Welcome, {user?.fullName} 👋</h1>
          <p>Your project dashboard on TeamLance.</p>
        </div>
        <Link to="/client/post-project"><button className="btn btn-primary">➕ Post New Project</button></Link>
      </div>

      {/* Stats */}
      <div className="grid grid-4 mb-lg">
        {[
          { icon:'📋', label:'Total Projects',  value: projects.length       },
          { icon:'🟢', label:'Open',             value: counts.OPEN           },
          { icon:'⚙️', label:'In Progress',      value: counts.IN_PROGRESS    },
          { icon:'✅', label:'Completed',        value: counts.COMPLETED      },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-val">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-3 mb-lg">
        {[
          { to:'/client/post-project',       icon:'➕', label:'Post a Project',       sub:'Describe what you need' },
          { to:'/client/browse-freelancers', icon:'👥', label:'Browse Freelancers',    sub:'Find the right talent'  },
          { to:'/client/projects',           icon:'📋', label:'Manage My Projects',    sub:'View proposals & status'},
        ].map(a => (
          <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow=''}>
              <div style={{ fontSize:'1.75rem', marginBottom:'.5rem' }}>{a.icon}</div>
              <div style={{ fontWeight:700 }}>{a.label}</div>
              <div className="text-sm text-muted mt-xs">{a.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent projects */}
      <div className="section-title">Recent Projects</div>
      {loading ? <Spinner /> : projects.length === 0
        ? <div className="card"><EmptyState icon="📋" title="No projects yet"
            sub="Post your first project to get started." /></div>
        : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Project</th><th>Budget</th><th>Skills</th>
                    <th>Status</th><th>Posted</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.slice(0, 10).map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight:600 }}>{p.title}</div>
                        <div className="text-xs text-muted">{p.durationDays} days</div>
                      </td>
                      <td>{currency(p.budgetMin || p.budget)}</td>
                      <td style={{ maxWidth:180 }}>
                        {(p.skillsRequired || p.requiredSkills || []).slice(0,3).map(s =>
                          <span key={s} className="chip">{typeof s === 'string' ? s.trim() : s}</span>)}
                      </td>
                      <td><Badge label={p.status} /></td>
                      <td className="text-xs text-muted">{timeAgo(p.createdAt)}</td>
                      <td>
                        <Link to={`/client/projects/${p.id}`}>
                          <button className="btn btn-ghost btn-sm">View →</button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }
    </div>
  );
}