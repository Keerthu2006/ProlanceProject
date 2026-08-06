import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOpenProjects } from '../../api/api';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { currency, timeAgo } from '../../utils/helpers';
import { Search, Filter, Code } from 'lucide-react';

export default function Marketplace() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getOpenProjects()
      .then(res => setProjects(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.skillsRequired && p.skillsRequired.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="page">
      <div className="flex-between page-header">
        <div>
          <h1 className="flex gap-sm">
            🚀 Project Marketplace
          </h1>
          <p>Find the perfect project for you or your team.</p>
        </div>
        <div className="flex gap-md">
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
              <Search size={18} color="var(--text-muted)" />
            </div>
            <input 
              type="text" 
              placeholder="Search projects, skills..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 40, width: 260 }}
            />
          </div>
          <button className="btn btn-ghost">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="spinner-wrap"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon="🔍" title="No projects found" sub="Try adjusting your search terms." />
        </div>
      ) : (
        <div className="grid">
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }} 
                 onClick={() => navigate(`/freelancer/project/${p.id}`)}
                 onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                 onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
              
              <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{p.title}</h3>
                  <div className="text-muted text-sm flex gap-sm" style={{ marginTop: 'var(--space-xs)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currency(p.budgetMin || p.budget)} - {currency(p.budgetMax || p.budget)}</span>
                    <span>•</span>
                    <span>{p.durationDays} days</span>
                    <span>•</span>
                    <span>Posted {timeAgo(p.createdAt)}</span>
                  </div>
                </div>
                <Badge label={p.status} />
              </div>
              
              <p className="text-muted" style={{ fontSize: '.875rem', marginBottom: 'var(--space-md)' }}>
                {p.description && p.description.length > 200 ? p.description.substring(0, 200) + '...' : p.description}
              </p>
              
              <div className="flex-between" style={{ alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {(p.skillsRequired || []).map(s => (
                    <span key={s} className="skill-tag flex gap-sm" style={{ padding: '.3rem .6rem' }}>
                      <Code size={12} /> {s}
                    </span>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); navigate(`/freelancer/project/${p.id}`); }}>
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
