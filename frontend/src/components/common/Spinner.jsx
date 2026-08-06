export default function Spinner({ size = 28, label = 'Loading…' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'2rem', gap:'.75rem', color:'#6b7280' }}>
      <div style={{
        width: size, height: size,
        border: '3px solid #e5e7eb',
        borderTopColor: '#6c63ff',
        borderRadius: '50%',
        animation: 'spin .7s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize: '.8rem' }}>{label}</span>
    </div>
  );
}