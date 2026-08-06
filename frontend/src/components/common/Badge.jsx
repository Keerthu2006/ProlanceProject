export default function Badge({ label, className = '' }) {
  return (
    <span className={`badge ${className || `badge-${(label || '').toLowerCase()}`}`}>
      {label}
    </span>
  );
}