import { useState, useEffect } from 'react';
import { getRecentEvents } from '../../api/api';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { timeAgo } from '../../utils/helpers';

const EVENT_ICON = {
  PROJECT_CREATED:      '📋',
  APPLICATION_RECEIVED: '📨',
  CLIENT_INACTIVE:      '⚠️',
  NEGATIVE_REVIEW:      '👎',
  PAYMENT_COMPLETED:    '💳',
  PROJECT_CANCELLED:    '❌',
  TEAM_CREATED:         '🤝',
  LOW_FEATURE_USAGE:    '📦',
  REVENUE_DECLINE:      '📉',
  OPPORTUNITY_DETECTED: '🚀',
};

const EVENT_COLOR = {
  PROJECT_CREATED:      '#10b981',
  APPLICATION_RECEIVED: '#3b82f6',
  CLIENT_INACTIVE:      '#f59e0b',
  NEGATIVE_REVIEW:      '#ef4444',
  PAYMENT_COMPLETED:    '#10b981',
  PROJECT_CANCELLED:    '#ef4444',
  TEAM_CREATED:         '#8b5cf6',
  LOW_FEATURE_USAGE:    '#f97316',
  REVENUE_DECLINE:      '#ef4444',
  OPPORTUNITY_DETECTED: '#6c63ff',
};

export default function EventFeedPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]  = useState('');

  useEffect(() => {
    getRecentEvents().then(r => setEvents(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? events.filter(e => e.eventType.toLowerCase().includes(search.toLowerCase()))
    : events;

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1>Business Event Feed</h1>
          <p>Every event raised by the Event Collector, latest first.</p>
        </div>
        <input className="form-input" style={{ width: 200 }}
          placeholder="Search event type…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <Spinner /> : filtered.length === 0
        ? <div className="card"><EmptyState icon="📡" title="No events yet"
            sub="Events are generated automatically when users interact with the platform." /></div>
        : (
          <div className="flex-col gap-sm">
            {filtered.map(ev => {
              let payload = {};
              try { payload = JSON.parse(ev.payloadJson || '{}'); } catch {}
              return (
                <div key={ev.id} className="card card-sm"
                  style={{ borderLeft: `4px solid ${EVENT_COLOR[ev.eventType] ?? '#e5e7eb'}` }}>
                  <div className="flex-between">
                    <div className="flex gap-sm">
                      <span style={{ fontSize: '1.2rem' }}>{EVENT_ICON[ev.eventType] ?? '📌'}</span>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '.875rem' }}>{ev.eventType}</span>
                        {ev.entityType && (
                          <span className="text-xs text-muted" style={{ marginLeft: '.5rem' }}>
                            {ev.entityType} #{ev.entityId}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-sm">
                      <span className={`badge ${ev.processed ? 'badge-approved' : 'badge-pending'}`}>
                        {ev.processed ? 'processed' : 'pending'}
                      </span>
                      <span className="text-xs text-muted">{timeAgo(ev.createdAt)}</span>
                    </div>
                  </div>
                  {Object.keys(payload).length > 0 && (
                    <div style={{
                      marginTop: '.6rem', fontSize: '.78rem', color: '#6b7280',
                      background: '#f8fafc', padding: '.5rem .75rem', borderRadius: 6,
                    }}>
                      {Object.entries(payload).slice(0, 4).map(([k, v]) => (
                        <span key={k} style={{ marginRight: '1rem' }}>
                          <strong>{k}:</strong> {String(v).slice(0, 40)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}