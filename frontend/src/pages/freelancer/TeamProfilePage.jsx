import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeam, getTeamMembers } from '../../api/api';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { Users, Award, Calendar } from 'lucide-react';
import { timeAgo } from '../../utils/helpers';

export default function TeamProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTeam(id),
      getTeamMembers(id)
    ])
    .then(([teamRes, memRes]) => {
      setTeam(teamRes.data);
      setMembers(memRes.data);
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner-wrap"><Spinner /></div>;
  if (!team) return <EmptyState icon="😕" title="Team not found" sub="This team does not exist." />;

  return (
    <div className="page">
      <button className="btn btn-ghost mb-md" onClick={() => navigate(-1)}>← Back</button>
      
      <div className="grid" style={{ gridTemplateColumns: '1fr 3fr' }}>
        
        {/* Left Sidebar */}
        <div>
          <div className="card text-center mb-md">
            <div className="freelancer-avatar mx-auto mb-md" style={{ margin: '0 auto var(--space-md) auto', width: 80, height: 80, fontSize: '2.5rem', background: 'var(--brand-secondary)' }}>
              {team.name.charAt(0)}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{team.name}</h2>
            
            <div className="flex gap-sm mt-md text-sm text-muted" style={{ justifyContent: 'center' }}>
              <Users size={16} /> {members.length} Members
            </div>

            <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 'var(--space-md) 0' }} />

            <div className="flex gap-sm mb-sm text-sm text-muted">
              <Calendar size={16} /> Founded {timeAgo(team.createdAt)}
            </div>
            <div className="flex gap-sm mb-sm text-sm text-muted">
              <Award size={16} /> Ready to hire
            </div>

            <button className="btn btn-primary btn-full mt-md">Hire Team</button>
          </div>
        </div>

        {/* Right Content */}
        <div>
          <div className="card mb-md">
            <h3 className="section-title">Team Members</h3>
            <div className="grid grid-2">
              {members.map(m => (
                <div key={m.id} className="card-sm flex gap-sm" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="freelancer-avatar" style={{ width: 40, height: 40, fontSize: '1rem', flexShrink: 0 }}>
                    {m.firstName ? m.firstName.charAt(0) : '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.firstName} {m.lastName}</div>
                    <div className="text-xs text-muted">
                      {m.role === 'ROLE_FREELANCER' ? 'Freelancer' : m.role} 
                      {team.leader?.id === m.id && <span className="badge badge-low" style={{ marginLeft: 6 }}>Leader</span>}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate(`/freelancer/profile/${m.id}`)}>
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
