export default function EmptyState({ icon = '📭', title = 'Nothing here yet', sub = '' }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <p style={{ fontWeight: 600, marginBottom: '.25rem' }}>{title}</p>
      {sub && <p style={{ fontSize: '.85rem' }}>{sub}</p>}
    </div>
  );
}