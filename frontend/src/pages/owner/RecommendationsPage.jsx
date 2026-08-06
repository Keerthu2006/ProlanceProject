import { useState, useEffect } from 'react';
import {
  getRecommendationHistory, approveRecommendation, rejectRecommendation,
} from '../../api/api';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { timeAgo } from '../../utils/helpers';

const TABS = ['ALL', 'PENDING', 'APPROVED', 'EXECUTED', 'REJECTED', 'FAILED'];

export default function RecommendationsPage() {
  const [history, setHistory] = useState([]);
  const [tab, setTab]         = useState('ALL');
  const [busy, setBusy]       = useState({});
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    getRecommendationHistory().then(r => setHistory(r.data)).finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const filtered = tab === 'ALL' ? history : history.filter(r => r.status === tab);

  const act = async (id, fn) => {
    setBusy(b => ({ ...b, [id]: true }));
    await fn(id);
    reload();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Recommendation History</h1>
        <p>All AI-generated recommendations across all four agents.</p>
      </div>

      {/* Filter tabs */}
      <div className="card card-sm mb-lg">
        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t}
              className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab(t)}>{t}</button>
          ))}
          <span className="text-muted text-sm" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
            {filtered.length} records
          </span>
        </div>
      </div>

      {loading ? <Spinner /> : filtered.length === 0
        ? <div className="card"><EmptyState icon="🤖" title="No recommendations yet" /></div>
        : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Agent / Severity</th><th>Priority</th>
                    <th>Problem</th><th>Action</th>
                    <th>Confidence</th><th>Status</th><th>When</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(rec => (
                    <tr key={rec.id}>
                      <td className="text-muted text-sm">{rec.id}</td>
                      <td>
                        <Badge label={rec.agentResult?.severity ?? 'LOW'} />
                        <div className="text-xs text-muted mt-xs">{rec.agentResult?.agentName}</div>
                      </td>
                      <td><strong>#{rec.priority}</strong></td>
                      <td style={{ maxWidth: 220 }}>
                        <div style={{ fontSize: '.85rem' }}>{rec.problem}</div>
                        <div className="text-xs text-muted mt-xs">{(rec.prediction ?? '').slice(0,60)}…</div>
                      </td>
                      <td style={{ maxWidth: 200, fontSize: '.82rem' }}>
                        {(rec.recommendedAction ?? '').slice(0, 80)}…
                      </td>
                      <td>{rec.confidence ? `${Math.round(rec.confidence)}%` : '—'}</td>
                      <td><Badge label={rec.status} /></td>
                      <td className="text-xs text-muted">{timeAgo(rec.createdAt)}</td>
                      <td>
                        {rec.status === 'PENDING' && (
                          <div className="flex gap-sm">
                            <button className="btn btn-success btn-sm"
                              disabled={busy[rec.id]}
                              onClick={() => act(rec.id, approveRecommendation)}>✓</button>
                            <button className="btn btn-ghost btn-sm"
                              disabled={busy[rec.id]}
                              onClick={() => act(rec.id, rejectRecommendation)}>✗</button>
                          </div>
                        )}
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