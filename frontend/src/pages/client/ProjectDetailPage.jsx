import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProject, getProjectApplications, hireFreelancer,
  completeProject, getMessages, sendMessage,
  submitReview, initiatePayment, completePayment,
} from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { currency, timeAgo, skillChips } from '../../utils/helpers';

/* ── Chat panel ──────────────────────────────────────────────── */
function ChatPanel({ projectId, userId }) {
  const [msgs, setMsgs] = useState([]);
  const [content, setContent] = useState('');
  const bottomRef = useRef(null);

  const loadMsgs = () => getMessages(projectId).then(r => setMsgs(r.data));
  useEffect(() => { loadMsgs(); const t = setInterval(loadMsgs, 8000); return () => clearInterval(t); }, [projectId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    await sendMessage(projectId, { content });
    setContent(''); loadMsgs();
  };

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div className="section-title">💬 Project Chat</div>
      <div className="chat-wrap">
        {msgs.length === 0
          ? <div className="text-muted text-sm text-center" style={{ padding: '1.5rem' }}>No messages yet.</div>
          : msgs.map(m => {
              const mine = m.sender?.id === userId;
              return (
                <div key={m.id} className={`chat-msg ${mine ? 'mine' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                  <div className="chat-bubble">{m.content}</div>
                  <div className="chat-time">{m.sender?.firstName} {m.sender?.lastName} · {timeAgo(m.createdAt || m.sentAt)}</div>
                </div>
              );
            })
        }
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-sm mt-md">
        <input className="form-input" style={{ flex: 1, padding: '.65rem' }} value={content} onChange={e => setContent(e.target.value)} placeholder="Type a message…" />
        <button className="btn btn-primary" type="submit">Send</button>
      </form>
    </div>
  );
}

/* ── Review modal ───────────────────────────────────────────── */
function ReviewModal({ projectId, revieweeId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await submitReview(projectId, { revieweeId, rating: Number(rating), comment }); onDone(); }
    finally { setBusy(false); }
  };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
      <div className="card" style={{ width:400 }}>
        <div className="section-title">⭐ Leave a Review</div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Rating (1–5)</label>
            <select className="form-select" value={rating} onChange={e => setRating(e.target.value)}>
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Comment</label>
            <textarea className="form-textarea" value={comment} onChange={e => setComment(e.target.value)} />
          </div>
          <div className="flex gap-sm">
            <button type="submit" className="btn btn-primary" disabled={busy}>Submit Review</button>
            <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function ProjectDetailPage() {
  const { id }      = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [project, setProject]   = useState(null);
  const [apps, setApps]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showReview, setReview] = useState(false);
  const [busy, setBusy]         = useState({});

  const load = async () => {
    setLoading(true);
    const [p, a] = await Promise.all([getProject(id), getProjectApplications(id)]);
    setProject(p.data); setApps(a.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="page"><Spinner /></div>;
  if (!project) return <div className="page"><div className="alert alert-error">Project not found.</div></div>;

  const isOwner = project.client?.id === user?.userId || project.client?.id === user?.id;

  const act = async (key, fn) => {
    setBusy(b => ({ ...b, [key]: true }));
    try { await fn(); await load(); } finally { setBusy(b => ({ ...b, [key]: false })); }
  };

  const handleHire = (fid) => act(`hire_${fid}`, () => hireFreelancer(id, fid));
  const handleComplete = () => act('complete', () => completeProject(id));
  const handlePay = async () => {
    const pay = await initiatePayment({ projectId: Number(id), amount: project.budget });
    await completePayment(pay.data.id);
    await load();
  };

  // Find the hired freelancer for reviews
  const hiredApp = apps.find(a => a.status === 'ACCEPTED');
  const revieweeId = hiredApp?.freelancer?.id;

  return (
    <div className="page">
      {showReview && (
        <ReviewModal projectId={id} revieweeId={revieweeId} onDone={() => { setReview(false); load(); }} />
      )}

      {/* Header */}
      <div className="card mb-lg">
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{project.title}</h1>
            <div className="flex gap-sm mt-xs text-muted text-sm">
              <span>💰 {currency(project.budgetMin || project.budget)}</span>
              <span>⏱ {project.durationDays} days</span>
              <span>👤 {project.client?.fullName}</span>
              {project.featured && <span className="chip chip-green">⭐ Featured</span>}
            </div>
          </div>
          <Badge label={project.status} />
        </div>
        {project.description && <p style={{ color: '#374151', lineHeight: 1.6 }}>{project.description}</p>}
        <div style={{ marginTop: '.875rem' }}>
          {skillChips(project.skillsRequired || project.requiredSkills).map(s => <span key={s} className="chip">{s}</span>)}
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="flex gap-sm mt-md">
            {project.status === 'IN_PROGRESS' && (
              <>
                <button className="btn btn-success btn-sm" disabled={busy.complete}
                  onClick={handleComplete}>✓ Mark Completed</button>
                <button className="btn btn-warning btn-sm" disabled={busy.pay}
                  onClick={handlePay}>💳 Record Payment</button>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => setReview(true)}>⭐ Leave Review</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Applications */}
      {isOwner && (
        <div className="mb-lg">
          <div className="section-title">
            Applications <span className="text-muted text-sm">({apps.length})</span>
          </div>
          {apps.length === 0
            ? <div className="card"><EmptyState icon="📨" title="No applications yet"
                sub="The AI will notify matching freelancers automatically." /></div>
            : apps.map(app => (
              <div key={app.id} className="card card-sm mb-md">
                <div className="flex-between">
                  <div>
                    <div style={{ fontWeight: 700 }}>{app.freelancer?.fullName}</div>
                    <div className="text-sm text-muted mt-xs">
                      Bid: {currency(app.bidAmount)} · {timeAgo(app.createdAt)}
                    </div>
                  </div>
                  <div className="flex gap-sm">
                    <Badge label={app.status} />
                    {app.status === 'PENDING' && project.status === 'OPEN' && (
                      <button className="btn btn-success btn-sm"
                        disabled={busy[`hire_${app.freelancer?.id}`]}
                        onClick={() => handleHire(app.freelancer?.id)}>
                        Hire
                      </button>
                    )}
                  </div>
                </div>
                {app.proposalText && (
                  <p style={{ marginTop: '.6rem', fontSize: '.875rem', color: '#374151' }}>
                    {app.proposalText}
                  </p>
                )}
              </div>
            ))
          }
        </div>
      )}

      {/* Chat */}
      <ChatPanel projectId={id} userId={user?.userId ?? user?.id} />
    </div>
  );
}