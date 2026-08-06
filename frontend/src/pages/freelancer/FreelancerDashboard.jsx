 import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyApplications, getAssignedProjects, getMyProfile, getOpenProjects } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { currency, timeAgo, skillChips } from '../../utils/helpers';

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile]     = useState(null);
  const [apps, setApps]           = useState([]);
  const [assigned, setAssigned]   = useState([]);
  const [openProjects, setOpenProjects] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([getMyProfile(), getMyApplications(), getAssignedProjects(), getOpenProjects()])
      .then(([p, a, s, o]) => { setProfile(p.data); setApps(a.data); setAssigned(s.data); setOpenProjects(o.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><Spinner /></div>;

  const pending  = apps.filter(a => a.status === 'PENDING').length;
  const accepted = apps.filter(a => a.status === 'ACCEPTED').length;

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1>Welcome, {user?.fullName} 👋</h1>
          <p>Your freelancer workspace on TeamLance.</p>
        </div>
        <Link to="/freelancer/browse"><button className="btn btn-primary">🔍 Browse Projects</button></Link>
      </div>

      {/* Profile quick view */}
      {profile && (
        <div className="card mb-lg">
          <div className="flex-between">
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.fullName}</div>
              {profile.headline && <div className="text-muted text-sm mt-xs">{profile.headline}</div>}
              <div style={{ marginTop: '.75rem' }}>
                {skillChips(profile.skills).map(s => <span key={s} className="chip">{s}</span>)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '1.4rem' }}>⭐ {profile.ratingAvg ?? 0}</div>
              <div className="text-muted text-sm">{profile.ratingCount ?? 0} reviews</div>
              <div className="text-sm mt-xs">{currency(profile.hourlyRate)}/hr</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-4 mb-lg">
        {[
          { icon:'📨', label:'Total Applications', value: apps.length     },
          { icon:'⏳', label:'Pending',             value: pending         },
          { icon:'✅', label:'Accepted',            value: accepted        },
          { icon:'🔨', label:'Active Projects',     value: assigned.length },
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
          { to:'/freelancer/browse',       icon:'🔍', label:'Browse Projects',    sub:'Find matching projects'      },
          { to:'/freelancer/applications', icon:'📨', label:'My Applications',    sub:'Track proposal status'       },
          { to:'/freelancer/profile',      icon:'👤', label:'Edit Profile',       sub:'Update skills & hourly rate' },
        ].map(a => (
          <Link key={a.to} to={a.to} style={{ textDecoration:'none' }}>
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

      {/* Active projects */}
      <div className="section-title">Active Projects</div>
      {assigned.length === 0
        ? <div className="card"><EmptyState icon="🔨" title="No active projects"
            sub="Get hired on a project first." /></div>
        : assigned.map(p => (
          <div key={p.id} className="card card-sm mb-md">
            <div className="flex-between">
              <div>
                <div style={{ fontWeight:700 }}>{p.title}</div>
                <div className="text-sm text-muted mt-xs">
                  {currency(p.budget)} · {p.durationDays} days · {p.client?.fullName}
                </div>
              </div>
              <div className="flex gap-sm">
                <Badge label={p.status} />
                <Link to={`/freelancer/project/${p.id}`}>
                  <button className="btn btn-ghost btn-sm">Open Chat</button>
                </Link>
              </div>
            </div>
          </div>
        ))
      }

      {/* Recent Open Projects feed */}
      <div className="section-title mt-lg">Recent Open Projects</div>
      {openProjects.length === 0
        ? <div className="card"><EmptyState icon="🔍" title="No open projects found" sub="Check back later for new opportunities." /></div>
        : openProjects.slice(0, 5).map(p => (
          <div key={p.id} className="card card-sm mb-md">
            <div className="flex-between">
              <div>
                <div style={{ fontWeight:700 }}>{p.title}</div>
                <div className="text-sm text-muted mt-xs flex gap-sm">
                  <span>{currency(p.budgetMin || p.budget)} - {currency(p.budgetMax || p.budget)}</span>
                  <span>·</span>
                  <span>{p.durationDays} days</span>
                  <span>·</span>
                  <span>{timeAgo(p.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-sm">
                <Link to={`/freelancer/project/${p.id}`}>
                  <button className="btn btn-primary btn-sm">View & Apply</button>
                </Link>
              </div>
            </div>
          </div>
        ))
      }
    </div>
  );
}