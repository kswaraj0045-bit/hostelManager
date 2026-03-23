import { useEffect, useMemo, useState } from 'react';
import { Bell, Loader2, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import Modal from '../components/common/Modal.jsx';
import Loader from '../components/common/Loader.jsx';
import * as expenseService from '../services/expenseService.js';
import * as settlementService from '../services/settlementService.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../context/AuthContext.jsx';

const GROUP_TYPE = {
  hostel: { emoji: '🏠' },
  trip: { emoji: '✈️' },
  friends: { emoji: '👫' },
  family: { emoji: '👨‍👩‍👧' },
  other: { emoji: '📦' }
};

const getId = (ref) => {
  if (!ref) return null;
  return ref._id ? ref._id.toString() : ref.toString();
};

const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;
const formatNetCurrency = (amount) => (
  Number(amount || 0) >= 0
    ? formatCurrency(amount)
    : `-₹${Math.abs(Number(amount || 0)).toFixed(2)}`
);

function SummaryCard({ title, value, accent, icon: Icon, valueColor, background, borderColor }) {
  return (
    <div
      className="glass card-hover"
      style={{
        padding: '22px',
        background,
        borderColor,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '13px', color: '#A7A9BE', fontWeight: 600 }}>{title}</p>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            background: `${accent}22`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon size={20} color={accent} />
        </div>
      </div>
      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '28px', fontWeight: 700, color: valueColor || '#FFFFFE' }}>
        {value}
      </p>
    </div>
  );
}

export default function Balances() {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState({
    totalOwed: 0,
    totalOwing: 0,
    netBalance: 0,
    balancesByGroup: []
  });
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = user?._id?.toString?.() || user?._id;

  const loadBalances = async () => {
    try {
      const res = await expenseService.getOverallBalance();
      setBalanceData(res.data?.data || {
        totalOwed: 0,
        totalOwing: 0,
        netBalance: 0,
        balancesByGroup: []
      });
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, []);

  const groupsWithBalances = useMemo(
    () => (balanceData.balancesByGroup || []).filter((group) => (group.balances || []).length > 0),
    [balanceData]
  );

  const openSettleModal = (balance) => {
    setSelectedBalance(balance);
    setSettlementAmount(balance.amount.toFixed(2));
    setNote('');
  };

  const closeSettleModal = (force = false) => {
    if (submitting && !force) return;
    setSelectedBalance(null);
    setSettlementAmount('');
    setNote('');
  };

  const handleRemind = async (balance) => {
    const otherUser = balance.owes;
    const message = `Hi ${otherUser?.name || 'there'}, you still owe me ${formatCurrency(balance.amount)} for ${balance.groupName}.`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        success('Reminder message copied to clipboard');
      } else {
        info(message);
      }
    } catch (_) {
      info(message);
    }
  };

  const handleSettlementSubmit = async (event) => {
    event.preventDefault();
    if (!selectedBalance) return;

    setSubmitting(true);
    try {
      await settlementService.addSettlement({
        group_id: selectedBalance.groupId,
        paid_to: getId(selectedBalance.owed),
        amount: parseFloat(settlementAmount),
        note
      });

      success('Settlement recorded');
      closeSettleModal(true);
      setSubmitting(false);
      setLoading(true);
      await loadBalances();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record settlement');
      setSubmitting(false);
      return;
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px', marginBottom: '6px' }}>
          Balances
        </h1>
        <p style={{ color: '#A7A9BE', fontSize: '14px' }}>
          Your complete split picture across every group, with each group tracked separately.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <SummaryCard
          title="You Are Owed"
          value={formatCurrency(balanceData.totalOwed)}
          accent="#2CB67D"
          icon={TrendingUp}
          valueColor="#2CB67D"
          background="linear-gradient(135deg, rgba(44,182,125,0.12), rgba(44,182,125,0.05))"
          borderColor="rgba(44,182,125,0.2)"
        />
        <SummaryCard
          title="You Owe"
          value={formatCurrency(balanceData.totalOwing)}
          accent="#FF6584"
          icon={TrendingDown}
          valueColor="#FF6584"
          background="linear-gradient(135deg, rgba(255,101,132,0.12), rgba(255,101,132,0.05))"
          borderColor="rgba(255,101,132,0.2)"
        />
        <SummaryCard
          title="Net Balance"
          value={formatNetCurrency(balanceData.netBalance)}
          accent="#6C63FF"
          icon={Scale}
          valueColor={balanceData.netBalance >= 0 ? '#2CB67D' : '#FF6584'}
          background="linear-gradient(135deg, rgba(108,99,255,0.16), rgba(255,101,132,0.12))"
          borderColor="rgba(108,99,255,0.22)"
        />
      </div>

      {groupsWithBalances.length === 0 ? (
        <div className="glass" style={{ padding: '56px', textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '12px' }}>🎉</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '20px', marginBottom: '8px' }}>
            All settled up across all groups!
          </h2>
          <p style={{ color: '#A7A9BE', fontSize: '14px' }}>
            No one owes you anything, and you do not owe anyone right now.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {groupsWithBalances.map((group) => {
            const groupMeta = GROUP_TYPE[group.groupType] || GROUP_TYPE.other;

            return (
              <div key={group.groupId} className="glass card-hover" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      className="gradient-bg"
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                      }}
                    >
                      {groupMeta.emoji}
                    </div>
                    <div>
                      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>
                        {group.groupName}
                      </h2>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: 'rgba(255,255,255,0.08)',
                          color: '#A7A9BE',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'capitalize'
                        }}
                      >
                        {group.groupType}
                      </span>
                    </div>
                  </div>
                  <p style={{ color: '#A7A9BE', fontSize: '12px' }}>{group.balances.length} open balance{group.balances.length > 1 ? 's' : ''}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {group.balances.map((balance) => {
                    const isCreditor = getId(balance.owed) === currentUserId;
                    const otherUser = isCreditor ? balance.owes : balance.owed;

                    return (
                      <div
                        key={`${group.groupId}-${getId(balance.owes)}-${getId(balance.owed)}`}
                        style={{
                          padding: '16px',
                          borderRadius: '16px',
                          background: isCreditor ? 'rgba(44,182,125,0.1)' : 'rgba(255,101,132,0.1)',
                          border: `1px solid ${isCreditor ? 'rgba(44,182,125,0.2)' : 'rgba(255,101,132,0.2)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '15px', color: '#FFFFFE', marginBottom: '4px' }}>
                            {isCreditor
                              ? `${otherUser?.name || 'Unknown'} owes you ${formatCurrency(balance.amount)}`
                              : `You owe ${otherUser?.name || 'Unknown'} ${formatCurrency(balance.amount)}`}
                          </p>
                          <p style={{ fontSize: '12px', color: '#A7A9BE' }}>
                            {isCreditor ? 'Waiting on payment' : 'Settle partially or in full from here'}
                          </p>
                        </div>

                        {isCreditor ? (
                          <button
                            onClick={() => handleRemind(balance)}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '12px',
                              border: '1px solid rgba(44,182,125,0.24)',
                              background: 'rgba(44,182,125,0.12)',
                              color: '#2CB67D',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <Bell size={15} />
                            Remind
                          </button>
                        ) : (
                          <button
                            onClick={() => openSettleModal(balance)}
                            className="gradient-btn"
                            style={{
                              padding: '10px 14px',
                              borderRadius: '12px',
                              fontSize: '13px',
                              fontWeight: 600
                            }}
                          >
                            Settle Up
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!selectedBalance}
        onClose={closeSettleModal}
        title="Settle Up"
        hideFooter
      >
        {selectedBalance && (
          <form onSubmit={handleSettlementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass" style={{ padding: '16px', background: 'rgba(108,99,255,0.08)', borderColor: 'rgba(108,99,255,0.2)' }}>
              <p style={{ fontSize: '12px', color: '#A7A9BE', marginBottom: '6px' }}>Paying</p>
              <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>{selectedBalance.owed?.name || 'Unknown'}</p>
              <p style={{ fontSize: '13px', color: '#A7A9BE' }}>
                {selectedBalance.groupName} • Maximum {formatCurrency(selectedBalance.amount)}
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#A7A9BE', marginBottom: '8px' }}>
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-dark"
                value={settlementAmount}
                onChange={(event) => setSettlementAmount(event.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#A7A9BE', marginBottom: '8px' }}>
                Note
              </label>
              <input
                type="text"
                className="input-dark"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={closeSettleModal}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: '#A7A9BE',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="gradient-btn"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Confirm Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
