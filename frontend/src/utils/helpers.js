export const currency = (v) =>
  `₹${Number(v || 0).toLocaleString('en-IN')}`;

export const dateStr = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const timeAgo = (iso) => {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const severityColor = (sev) => ({
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#10b981',
}[sev] || '#6b7280');

export const statusBadgeClass = (s) =>
  `badge badge-${(s || '').toLowerCase()}`;

export const skillChips = (commaSep) =>
  (commaSep || '').split(',').map(s => s.trim()).filter(Boolean);