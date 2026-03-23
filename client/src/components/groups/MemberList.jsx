export default function MemberList({ members }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {members?.map((member) => (
        <div
          key={member.user._id}
          className="glass"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#252436' }}
        >
          <div className="gradient-bg" style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
            {member.user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, color: '#FFFFFE' }}>{member.user?.name}</p>
            <p style={{ fontSize: '13px', color: '#A7A9BE' }}>{member.user?.email}</p>
          </div>
          {member.role === 'admin' && (
            <span style={{ fontSize: '12px', background: 'rgba(255,137,6,0.15)', color: '#FF8906', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>
              Admin
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
