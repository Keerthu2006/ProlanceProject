import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyProjects, cancelProject } from '../../api/api';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { currency, timeAgo, skillChips } from '../../utils/helpers';

export default function MyProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    getMyProjects().then(r => setProjects(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this project?')) return;
    await cancelProject(id);
    load();
  };

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1>My Projects</h1><p>All projects you have posted.</p></div>
        <Link to="/client/post-project"><button className="btn btn-primary">➕ New Project</button></Link>
      </div>

      {loading ? <Spinner /> : projects.length === 0
        ? <div className="card"><EmptyState icon="📋" title="No projects yet"
            sub="Post your first project to get started." /></div>
        : (
          <div className="flex-col gap-sm">
            {projects.map(p => (
              <div key={p.id} className="card project-card">
                <div className="flex-between" style={{ marginBottom: '.6rem' }}>
                  <div>
                    <div className="project-card-title">{p.title}</div>
                    <div className="project-card-meta">
                      <span>💰 {currency(p.budgetMin || p.budget)}</span>
                      <span>⏱ {p.durationDays} days</span>
                      {p.featured && <span className="chip chip-green">⭐ Featured</span>}
                    </div>
                  </div>
                  <Badge label={p.status} />
                </div>
                <div className="project-card-skills">
                  {skillChips(p.skillsRequired || p.requiredSkills).map(s => <span key={s} className="chip">{s}</span>)}
                </div>
                <div className="project-card-footer">
                  <span className="text-xs text-muted">Posted {timeAgo(p.createdAt)}</span>
                  <div className="flex gap-sm">
                    <Link to={`/client/projects/${p.id}`}>
                      <button className="btn btn-ghost btn-sm">View Details</button>
                    </Link>
                    {p.status === 'OPEN' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(p.id)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}