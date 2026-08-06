import { useState, useEffect } from 'react';
import { getAutomationLog } from '../../api/api';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { timeAgo } from '../../utils/helpers';

const ACTION_ICON = {
  NOTIFY_FREELANCERS:     '📣',
  FEATURE_PROJECT:        '⭐',
  EMAIL_CLIENT:           '📧',
  EMAIL_OWNER_REPORT:     '📊',
  DRAFT_EMAIL_CAMPAIGN:   '✉️',
  DRAFT_SOCIAL_POST:      '📱',
  DRAFT_LANDING_PAGE:     '🌐',
  DRAFT_HOMEPAGE_BANNER:  '🖼️',
  DRAFT_RECRUITMENT_EMAIL:'👋',
  CREATE_CATEGORY:        '🏷️',
  SCHEDULE_FOLLOWUP:      '⏰',
};

export default function AutomationLogPage() {
  const [log, setLog]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAutomationLog().then(r => setLog(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Automation Log</h1>
        <p>Every action executed by the Automation Engine after owner approval.</p>
      </div>

      {loading ? <Spinner /> : log.length === 0
        ? <div className="card"><EmptyState icon="⚡" title="No automation actions yet"
            sub="Approve a recommendation from the Overview page to trigger automation." /></div>
        : (
          <div className="flex-col gap-sm">
            {log.map(a => (
              <div key={a.id} className="card card-sm">
                <div className="flex-between">
                  <div className="flex gap-sm">
                    <span style={{ fontSize: '1.3rem' }}>
                      {ACTION_ICON[a.actionType] ?? '🔧'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{a.actionType}</div>
                      <div className="text-xs text-muted mt-xs">
                        Recommendation #{a.recommendation?.id} · {timeAgo(a.executedAt)}
                      </div>
                    </div>
                  </div>
                  <Badge label={a.resultStatus === 'SUCCESS' ? 'approved' : 'failed'}
                    className={`badge badge-${a.resultStatus === 'SUCCESS' ? 'approved' : 'failed'}`} />
                </div>
                {a.actionDetail && (
                  <div style={{
                    marginTop: '.75rem', padding: '.75rem',
                    background: '#f8fafc', borderRadius: 8,
                    fontSize: '.82rem', color: '#374151',
                    whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'hidden',
                  }}>
                    {a.actionDetail.slice(0, 400)}{a.actionDetail.length > 400 ? '…' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}