import { useState, useEffect } from 'react';
import { getFreelancers, getFreelancerReviews } from '../../api/api';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { skillChips, currency } from '../../utils/helpers';

function FreelancerCard({ fp }) {
  const [reviews, setReviews] = useState([]);
  const [open, setOpen] = useState(false);

  const loadReviews = async () => {
    if (!open) {
      const r = await getFreelancerReviews(fp.user?.id);
      setReviews(r.data);
    }
    setOpen(o => !o);
  };

  return (
    <div className="card">
      <div className="flex-between mb-md">
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{fp.user?.fullName}</div>
          {fp.headline && <div className="text-sm text-muted mt-xs">{fp.headline}</div>}
        </div>
        <div className="text-sm" style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700 }}>{currency(fp.hourlyRate)}/hr</div>
          <div className="text-muted">⭐ {fp.ratingAvg ?? 0} ({fp.ratingCount ?? 0})</div>
        </div>
      </div>
      <div style={{ marginBottom: '.875rem' }}>
        {skillChips(fp.skills).map(s => <span key={s} className="chip">{s}</span>)}
      </div>
      {fp.bio && <p className="text-sm text-muted" style={{ marginBottom: '.875rem', lineHeight: 1.5 }}>{fp.bio.slice(0, 120)}…</p>}
      <button className="btn btn-ghost btn-sm w-full" onClick={loadReviews}>
        {open ? '▲ Hide Reviews' : '▼ View Reviews'}
      </button>
      {open && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          {reviews.length === 0
            ? <p className="text-sm text-muted">No reviews yet.</p>
            : reviews.map(r => (
              <div key={r.id} style={{ marginBottom: '.75rem' }}>
                <div className="flex gap-sm">
                  {'⭐'.repeat(r.rating)}
                  <span className="text-xs text-muted">{r.client?.fullName}</span>
                </div>
                {r.comment && <p className="text-sm" style={{ marginTop: '.25rem' }}>{r.comment}</p>}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

export default function BrowseFreelancersPage() {
  const [freelancers, setFreelancers] = useState([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);

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
        <div><h1>Browse Freelancers</h1><p>Find the right talent for your project.</p></div>
        <input className="form-input" style={{ width: 240 }} placeholder="Search name or skill…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <Spinner /> : filtered.length === 0
        ? <div className="card"><EmptyState icon="👥" title="No freelancers found" /></div>
        : (
          <div className="grid grid-3">
            {filtered.map(fp => <FreelancerCard key={fp.id} fp={fp} />)}
          </div>
        )
      }
    </div>
  );
}