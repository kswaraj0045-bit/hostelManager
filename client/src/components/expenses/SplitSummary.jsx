export default function SplitSummary({ balances, currentUserId, userMap }) {
  if (!balances?.length) {
    return <p style={{ color: '#A7A9BE' }}>No balances to settle</p>;
  }

  const filtered = balances.filter(
    (balance) => balance.owes === currentUserId || balance.owed === currentUserId
  );

  if (!filtered.length) {
    return <p style={{ color: '#A7A9BE' }}>You are fully settled in this group.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {filtered.map((balance, index) => {
        const otherUserId = balance.owes === currentUserId ? balance.owed : balance.owes;
        const otherUser = userMap?.[otherUserId] || otherUserId;
        const isCreditor = balance.owed === currentUserId;

        return (
          <div key={index} className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#252436' }}>
            <span style={{ color: '#FFFFFE', fontSize: '14px' }}>
              {isCreditor
                ? `${otherUser} owes you Rs ${balance.amount.toFixed(2)}`
                : `You owe ${otherUser} Rs ${balance.amount.toFixed(2)}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
