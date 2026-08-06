import { useState, useEffect } from 'react';
import { getFreelancers } from '../../api/api';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { skillChips } from '../../utils/helpers';

export default function OwnerFreelancersPage() {
  const [freelancers, setFreelancers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFreelancers().then(r => setFreelancers(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = freelancers.filter(fp =>
    !search ||
    fp.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    fp.skills?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1>All Freelancers</h1>
          <p>Platform freelancer skill distribution — used by the Opportunity Agent.</p>
        </div>
        <input className="form-input" style={{ width: 220 }} placeholder="Search name or skill…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <Spinner /> : filtered.length === 0
        ? <div className="card"><EmptyState icon="👥" title="No freelancers found" /></div>
        : (
          <div className="grid grid-3">
            {filtered.map(fp => (
              <div key={fp.id} className="card">
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fp.user?.fullName}</div>
                {fp.headline && <div className="text-muted text-sm mt-xs">{fp.headline}</div>}
                <div style={{ margin: '.75rem 0' }}>
                  {skillChips(fp.skills).map(s => <span key={s} className="chip">{s}</span>)}
                </div>
                <div className="flex-between text-sm text-muted">
                  <span>⭐ {fp.ratingAvg ?? 0} ({fp.ratingCount ?? 0} reviews)</span>
                  <span>₹{fp.hourlyRate ?? 0}/hr</span>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}