import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    getDashboardSummary, getPendingRecommendations,
    approveRecommendation, rejectRecommendation,
} from '../../api/api';
import ScoreBar from '../../components/common/ScoreBar';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { timeAgo, currency } from '../../utils/helpers';

/* ── Agent metadata ─────────────────────────────────────────── */
const AGENTS = [
    { key: 'customer', icon: '👤', label: 'Customer Neglect', color: '#ef4444' },
    { key: 'product', icon: '📦', label: 'Product Neglect', color: '#f97316' },
    { key: 'financial', icon: '💰', label: 'Revenue Risk', color: '#f59e0b' },
    { key: 'opportunity', icon: '🚀', label: 'Opportunity', color: '#10b981' },
];

/* ── Sub-components ─────────────────────────────────────────── */
function AgentCard({ agent, data }) {
    const sev = data?.[`${agent.key}_severity`] ?? 'LOW';
    const score = data?.[`${agent.key}_score`] ?? 0;
    const sum = data?.[`${agent.key}_summary`] ?? '';
    return (
        <div className="card agent-card" style={{ borderTopColor: agent.color }}>
            <div className="flex-between">
                <span style={{ fontSize: '1.6rem' }}>{agent.icon}</span>
                <Badge label={sev} />
            </div>
            <div style={{ fontWeight: 700, marginTop: '.6rem' }}>{agent.label}</div>
            {sum && (
                <p style={{ fontSize: '.78rem', color: '#6b7280', marginTop: '.3rem', lineHeight: 1.4 }}>
                    {sum.length > 90 ? sum.slice(0, 87) + '…' : sum}
                </p>
            )}
            <ScoreBar score={score} severity={sev} />
        </div>
    );
}

function RecCard({ rec, onApprove, onReject }) {
    const [busy, setBusy] = useState(false);
    const sev = rec.agentResult?.severity ?? 'MEDIUM';
    const run = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };

    return (
        <div className={`rec-card ${sev.toLowerCase()}`}>
            {/* Header row */}
            <div className="flex-between mb-md">
                <div className="flex gap-sm">
                    <span style={{ fontWeight: 700 }}>Priority #{rec.priority}</span>
                    <Badge label={sev} />
                    <span className="text-xs text-muted">{rec.agentResult?.agentName} · {timeAgo(rec.createdAt)}</span>
                </div>
                <Badge label={rec.status} />
            </div>

            {/* Fields */}
            {[
                ['Problem', rec.problem],
                ['Reason', rec.reason],
                ['Prediction', rec.prediction],
            ].map(([lbl, val]) => val && (
                <div key={lbl} style={{ marginBottom: '.6rem' }}>
                    <div className="rec-field-label">{lbl}</div>
                    <div className="rec-field-value">{val}</div>
                </div>
            ))}

            {/* Action box */}
            <div className="rec-action-box">
                <div className="rec-field-label" style={{ color: '#4f46e5' }}>Recommended Action</div>
                <div className="rec-field-value" style={{ marginTop: '.3rem' }}>{rec.recommendedAction}</div>
                <div className="rec-meta">
                    {rec.expectedImprovement && <span>📈 {rec.expectedImprovement}</span>}
                    {rec.confidence && <span>🎯 Confidence: {Math.round(rec.confidence)}%</span>}
                </div>
            </div>

            {/* Buttons */}
            {rec.status === 'PENDING' && (
                <div className="flex gap-sm">
                    <button className="btn btn-success btn-sm" disabled={busy}
                        onClick={() => run(onApprove)}>✓ Approve &amp; Execute</button>
                    <button className="btn btn-ghost btn-sm" disabled={busy}
                        onClick={() => run(onReject)}>✗ Reject</button>
                </div>
            )}
        </div>
    );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function OwnerOverview() {
    const [summary, setSummary] = useState(null);
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);
    const refresh = useCallback(() => setTick(t => t + 1), []);

    useEffect(() => {
        setLoading(true);
        Promise.all([getDashboardSummary(), getPendingRecommendations()])
            .then(([s, p]) => { setSummary(s.data); setPending(p.data); })
            .finally(() => setLoading(false));
    }, [tick]);

    if (loading) return <div className="page"><Spinner /></div>;

    return (
        <div className="page">
            {/* Header */}
            <div className="flex-between page-header">
                <div>
                    <h1>TriGrowth AI Dashboard</h1>
                    <p>Proactive intelligence — monitoring, predicting, recommending, automating.</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={refresh}>↻ Refresh</button>
            </div>

            {/* Platform stat strip */}
            <div className="grid grid-4 mb-lg">
                {[
                    { icon: '📋', val: summary?.total_projects, label: 'Total Projects' },
                    { icon: '🟢', val: summary?.open_projects, label: 'Open Projects' },
                    { icon: '🙋', val: summary?.total_clients, label: 'Clients' },
                    { icon: '💻', val: summary?.total_freelancers, label: 'Freelancers' },
                ].map(s => (
                    <div key={s.label} className="card stat-card">
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-val">{s.val ?? '—'}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Agent cards */}
            <div className="section-title">Agent Status</div>
            <div className="grid grid-4 mb-lg">
                {AGENTS.map(a => <AgentCard key={a.key} agent={a} data={summary} />)}
            </div>

            {/* Quick links */}
            <div className="grid grid-4 mb-lg">
                {[
                    { to: '/owner/recommendations', icon: '📋', label: 'All Recommendations' },
                    { to: '/owner/automation', icon: '⚡', label: 'Automation Log' },
                    { to: '/owner/events', icon: '📡', label: 'Event Feed' },
                    { to: '/owner/revenue', icon: '💰', label: 'Revenue Charts' },
                ].map(l => (
                    <Link key={l.to} to={l.to} style={{ textDecoration: 'none' }}>
                        <div className="card card-sm flex gap-sm" style={{ cursor: 'pointer', transition: 'box-shadow .2s' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.1)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                            <span style={{ fontSize: '1.4rem' }}>{l.icon}</span>
                            <span style={{ fontWeight: 600, fontSize: '.875rem' }}>{l.label}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pending approvals */}
            <div className="flex-between mb-md">
                <div className="section-title" style={{ marginBottom: 0 }}>
                    Pending Approvals
                    {pending.length > 0 && (
                        <span className="badge badge-pending" style={{ marginLeft: '.5rem' }}>{pending.length}</span>
                    )}
                </div>
                <Link to="/owner/recommendations">View full history →</Link>
            </div>

            {pending.length === 0
                ? <div className="card"><EmptyState icon="✅" title="No pending recommendations"
                    sub="TriGrowth AI is actively monitoring your platform." /></div>
                : pending.sort((a, b) => a.priority - b.priority).map(rec => (
                    <RecCard key={rec.id} rec={rec}
                        onApprove={() => approveRecommendation(rec.id).then(refresh)}
                        onReject={() => rejectRecommendation(rec.id).then(refresh)} />
                ))
            }
        </div>
    );
}