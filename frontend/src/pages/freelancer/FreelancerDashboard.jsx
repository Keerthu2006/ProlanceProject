 import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getMyApplications, getMyProfile, getOpenProjects,
  getIndividualProjects, getTeamProjectsForMe, getMyTeams
} from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { currency, timeAgo, skillChips } from '../../utils/helpers';

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile]           = useState(null);
  const [apps, setApps]                 = useState([]);
  const [soloProjects, setSoloProjects]  = useState([]);
  const [teamProjects, setTeamProjects]  = useState([]);
  const [myTeams, setMyTeams]           = useState([]);
  const [openProjects, setOpenProjects]  = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      getMyProfile(),
      getMyApplications(),
      getIndividualProjects(),
      getTeamProjectsForMe(),
      getMyTeams(),
      getOpenProjects()
    ])
    .then(([p, a, solo, team, teams, o]) => {
      setProfile(p.data);
      setApps(a.data);
      setSoloProjects(solo.data || []);
      setTeamProjects(team.data || []);
      setMyTeams(teams.data || []);
      setOpenProjects(o.data);
    })
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><Spinner /></div>;

  const pending  = apps.filter(a => a.status === 'PENDING').length;
  const accepted = apps.filter(a => a.status === 'ACCEPTED').length;
  const totalActive = soloProjects.length + teamProjects.length;

  // Helper: find the team object for a given team project
  const getTeamForProject = (project) => {
    return myTeams.find(t =>
      t.projects?.some(p => p.id === project.id) // optional chaining — may not always be populated
    );
  };

  // Group team projects by team
  const teamProjectsByTeam = myTeams.reduce((acc, team) => {
    const projects = teamProjects.filter(p =>
      // We identify by checking if the project is in our teamProjects list
      // (the backend already filtered by team membership)
      teamProjects.some(tp => tp.id === p.id)
    );
    if (projects.length > 0) {
      acc[team.id] = { team, projects };
    }
    return acc;
  }, {});

  const renderProjectCard = (p, isTeam = false) => (
    <div key={p.id} className="card card-sm mb-md">
      <div className="flex-between">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isTeam && <span style={{ fontSize: '0.7rem', background: 'var(--brand-secondary)', color: 'var(--bg-base)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>👥 TEAM</span>}
            <div style={{ fontWeight: 700 }}>{p.title}</div>
          </div>
          <div className="text-sm text-muted mt-xs">
            {currency(p.budgetMin)} – {currency(p.budgetMax)} · {p.durationDays} days
          </div>
        </div>
        <div className="flex gap-sm">
          <Badge label={p.status} />
          <Link to={`/freelancer/project/${p.id}`}>
            <button className="btn btn-ghost btn-sm">Open</button>
          </Link>
        </div>
      </div>
    </div>
  );

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
          { icon:'📨', label:'Total Applications', value: apps.length },
          { icon:'⏳', label:'Pending',             value: pending     },
          { icon:'✅', label:'Accepted',            value: accepted    },
          { icon:'🔨', label:'Active Projects',     value: totalActive },
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

      {/* ── SOLO PROJECTS ───────────────────────────────────────────── */}
      <div className="section-title">🧑 My Solo Projects</div>
      {soloProjects.length === 0
        ? <div className="card mb-lg"><EmptyState icon="🔨" title="No solo projects yet" sub="Apply to individual projects to see them here." /></div>
        : soloProjects.map(p => renderProjectCard(p, false))
      }

      {/* ── TEAM PROJECTS ───────────────────────────────────────────── */}
      <div className="section-title mt-lg">👥 Team Projects</div>
      {teamProjects.length === 0 ? (
        <div className="card mb-lg">
          <EmptyState icon="👥" title="No team projects yet"
            sub="Create a team and bid on a Team-type project. All members will see it here." />
        </div>
      ) : (
        <>
          {/* Group by team */}
          {myTeams.map(team => {
            // Find which teamProjects belong to this team
            // Since the backend only returns projects for teams the user is in,
            // and each project is marked with a teamId on the Application,
            // we just show all teamProjects under each of the user's teams for now.
            // A finer grouping would require the API to return teamId on each project.
            return (
              <div key={team.id} className="card mb-md" style={{ border: '1px solid rgba(153,126,103,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--brand-secondary)', color: 'var(--bg-base)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1.1rem'
                  }}>{team.name?.charAt(0) ?? '?'}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{team.name}</div>
                    <div className="text-sm text-muted">{team.members?.length ?? 0} members · {team.leader?.id === user?.id ? '👑 You are the leader' : '🤝 You are a member'}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    {team.members?.slice(0, 4).map(m => (
                      <div key={m.id} title={m.fullName} style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--brand-muted)', color: 'var(--text-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700
                      }}>{m.fullName?.charAt(0) ?? '?'}</div>
                    ))}
                  </div>
                </div>
                {/* Show team projects */}
                {teamProjects.length === 0 ? (
                  <div className="text-sm text-muted">No accepted projects for this team yet.</div>
                ) : teamProjects.map(p => renderProjectCard(p, true))}
              </div>
            );
          })}
          {/* Fallback if no teams found but teamProjects exist */}
          {myTeams.length === 0 && teamProjects.map(p => renderProjectCard(p, true))}
        </>
      )}

      {/* ── RECENT OPEN PROJECTS ────────────────────────────────────── */}
      <div className="section-title mt-lg">🔍 Recent Open Projects</div>
      {openProjects.length === 0
        ? <div className="card"><EmptyState icon="🔍" title="No open projects found" sub="Check back later for new opportunities." /></div>
        : openProjects.slice(0, 5).map(p => (
          <div key={p.id} className="card card-sm mb-md">
            <div className="flex-between">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {p.projectType === 'TEAM' && <span style={{ fontSize: '0.7rem', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>👥 TEAM</span>}
                  <div style={{ fontWeight:700 }}>{p.title}</div>
                </div>
                <div className="text-sm text-muted mt-xs flex gap-sm">
                  <span>{currency(p.budgetMin)} – {currency(p.budgetMax)}</span>
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