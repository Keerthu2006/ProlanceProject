import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFreelancerProfile, getFreelancerReviews } from '../../api/api';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { Star, MapPin, Mail, Award, Clock } from 'lucide-react';
import { currency } from '../../utils/helpers';

export default function FreelancerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getFreelancerProfile(id),
      getFreelancerReviews(id)
    ])
    .then(([profRes, revRes]) => {
      setProfile(profRes.data);
      setReviews(revRes.data);
    })
    .catch(err => {
      console.error(err);
    })
    .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner-wrap"><Spinner /></div>;
  if (!profile) return <EmptyState icon="😕" title="Profile not found" sub="This freelancer does not exist." />;

  const user = profile.user || {};
  const avgRating = reviews.length ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="page">
      <button className="btn btn-ghost mb-md" onClick={() => navigate(-1)}>← Back</button>
      
      <div className="grid" style={{ gridTemplateColumns: '1fr 3fr' }}>
        
        {/* Left Sidebar */}
        <div>
          <div className="card text-center mb-md">
            <div className="freelancer-avatar mx-auto mb-md" style={{ margin: '0 auto var(--space-md) auto', width: 80, height: 80, fontSize: '2rem' }}>
              {user.firstName ? user.firstName.charAt(0) : '?'}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{user.firstName} {user.lastName}</h2>
            <div className="text-muted text-sm">{profile.headline || 'Freelancer'}</div>
            
            <div className="flex gap-sm mt-md" style={{ justifyContent: 'center' }}>
              <div className="flex gap-xs" style={{ color: 'var(--sev-medium)', fontWeight: 700 }}>
                <Star size={16} fill="currentColor" /> {avgRating}
              </div>
              <span className="text-muted text-sm">({reviews.length} reviews)</span>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 'var(--space-md) 0' }} />

            <div className="flex gap-sm mb-sm text-sm text-muted">
              <Clock size={16} /> {profile.hourlyRate ? `${currency(profile.hourlyRate)}/hr` : 'Negotiable'}
            </div>
            <div className="flex gap-sm mb-sm text-sm text-muted">
              <Award size={16} /> AI Match Score: {profile.aiScore ? (profile.aiScore * 10).toFixed(0) + '/10' : 'N/A'}
            </div>
            <div className="flex gap-sm mb-sm text-sm text-muted">
              <Mail size={16} /> {user.email}
            </div>

            <button className="btn btn-primary btn-full mt-md">Invite to Project</button>
          </div>
        </div>

        {/* Right Content */}
        <div>
          <div className="card mb-md">
            <h3 className="section-title">About Me</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', lineHeight: 1.7 }}>
              {profile.bio || "This freelancer hasn't written a bio yet."}
            </p>
          </div>

          <div className="card mb-md">
            <h3 className="section-title">Skills</h3>
            <div>
              {(profile.skills || []).length > 0 ? profile.skills.map(s => (
                <span key={s} className="skill-tag" style={{ fontSize: '.85rem', padding: '.4rem .8rem' }}>{s}</span>
              )) : <span className="text-muted text-sm">No skills listed.</span>}
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <EmptyState icon="⭐" title="No reviews yet" sub="This freelancer doesn't have any reviews." />
            ) : (
              <div className="grid gap-md">
                {reviews.map(r => (
                  <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-md)' }}>
                    <div className="flex-between mb-sm">
                      <div className="flex gap-sm" style={{ color: 'var(--sev-medium)', fontWeight: 700 }}>
                        <Star size={14} fill="currentColor" /> {r.rating}.0
                      </div>
                      <div className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <p style={{ fontSize: '.875rem' }}>{r.comment || 'No comment provided.'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
