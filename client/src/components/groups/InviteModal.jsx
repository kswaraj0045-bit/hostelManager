import Modal from '../common/Modal.jsx';

export default function InviteModal({ open, onClose, inviteCode }) {
  return (
    <Modal open={open} onClose={onClose} title="Invite Code" hideFooter>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ color: '#A7A9BE', fontSize: '14px' }}>Share this code to invite members:</p>
        <p style={{ fontSize: '28px', fontFamily: 'monospace', fontWeight: 700, textAlign: 'center', padding: '16px', borderRadius: '12px', background: '#252436', color: '#FFFFFE', letterSpacing: '3px' }}>
          {inviteCode}
        </p>
        <button
          onClick={() => navigator.clipboard?.writeText(inviteCode)}
          className="gradient-btn"
          style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px' }}
        >
          Copy Code
        </button>
        <button onClick={onClose} className="secondary-btn-dark" style={{ width: '100%' }}>
          Close
        </button>
      </div>
    </Modal>
  );
}
