import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import * as groupService from '../services/groupService.js';
import * as expenseService from '../services/expenseService.js';
import * as settlementService from '../services/settlementService.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function SettleUp() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [group, setGroup] = useState(null);
  const [balances, setBalances] = useState([]);
  const [paidTo, setPaidTo] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const userId = user?._id?.toString?.() || user?._id;

  useEffect(() => {
    const load = async () => {
      try {
        const [groupRes, balanceRes] = await Promise.all([
          groupService.getGroup(groupId),
          expenseService.getBalance(groupId)
        ]);
        setGroup(groupRes.data?.data);
        setBalances(balanceRes.data?.data || []);
      } catch (err) {
        error(err.response?.data?.message || 'Failed to load');
        navigate('/groups');
      }
    };

    load();
  }, [groupId, error, navigate]);

  const getOwed = (memberId) => {
    const balance = balances.find((item) => item.owes === userId && item.owed === memberId);
    return balance ? balance.amount : 0;
  };

  const settleTargets = useMemo(() => {
    const members = group?.members || [];
    return members
      .filter((member) => (member.user._id?.toString?.() || member.user._id) !== userId)
      .map((member) => {
        const memberId = member.user._id?.toString?.() || member.user._id;
        return {
          ...member,
          memberId,
          owedAmount: getOwed(memberId)
        };
      })
      .filter((member) => member.owedAmount > 0);
  }, [group, userId, balances]);

  const selectedPerson = settleTargets.find((member) => member.memberId === paidTo);

  useEffect(() => {
    if (paidTo && !settleTargets.some((member) => member.memberId === paidTo)) {
      setPaidTo('');
      setAmount('');
    }
  }, [settleTargets, paidTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paidTo || !amount) {
      error('Select a member you owe and enter an amount');
      return;
    }

    setLoading(true);
    try {
      await settlementService.addSettlement({
        group_id: groupId,
        paid_to: paidTo,
        amount: parseFloat(amount),
        note
      });
      success('Settlement recorded');
      setDone(true);
      setTimeout(() => navigate(`/groups/${groupId}`), 2000);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div style={{ color: '#2CB67D', display: 'flex' }}>
          <CheckCircle size={64} />
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px' }}>All Settled!</h2>
        <p style={{ color: '#A7A9BE' }}>Settlement recorded successfully. Redirecting...</p>
        <style>{`
          @keyframes confettiFall {
            0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px' }}>Settle Up</h1>
      <p style={{ color: '#A7A9BE', fontSize: '14px' }}>Record a payment to a member you currently owe.</p>

      <div>
        <p style={{ fontSize: '13px', fontWeight: 500, color: '#A7A9BE', marginBottom: '12px' }}>Settle up with</p>
        {settleTargets.length === 0 ? (
          <div className="glass" style={{ padding: '20px', textAlign: 'center', color: '#A7A9BE' }}>
            You do not owe anyone in this group right now.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {settleTargets.map((member) => {
              const isSelected = paidTo === member.memberId;
              return (
                <div
                  key={member.memberId}
                  onClick={() => {
                    setPaidTo(member.memberId);
                    setAmount(member.owedAmount.toFixed(2));
                  }}
                  className="glass card-hover"
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    borderColor: isSelected ? '#6C63FF' : undefined,
                    background: isSelected ? 'rgba(108,99,255,0.1)' : undefined,
                    textAlign: 'center'
                  }}
                >
                  <div className="gradient-bg" style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '16px', margin: '0 auto 8px' }}>
                    {member.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{member.user.name}</p>
                  <p style={{ fontSize: '12px', color: '#FF6584' }}>You owe Rs {member.owedAmount.toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A7A9BE', marginBottom: '8px' }}>Amount (Rs)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px', color: '#6C63FF', fontWeight: 700 }}>Rs</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-dark"
              style={{ paddingLeft: '48px', fontSize: '20px', fontWeight: 700 }}
              placeholder="0.00"
              required
              disabled={settleTargets.length === 0}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A7A9BE', marginBottom: '8px' }}>Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input-dark"
            placeholder="e.g. Lunch split"
            disabled={settleTargets.length === 0}
          />
        </div>

        {paidTo && amount && selectedPerson && (
          <div className="glass" style={{ padding: '16px', borderColor: 'rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div className="gradient-bg" style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <ArrowRight size={18} color="#6C63FF" />
            <div className="gradient-bg" style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px' }}>
              {selectedPerson.user.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '14px', color: '#A7A9BE', marginLeft: '8px' }}>
              Rs {parseFloat(amount || 0).toFixed(2)}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate(`/groups/${groupId}`)}
            style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A7A9BE', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || settleTargets.length === 0}
            className="gradient-btn"
            style={{ flex: 2, padding: '14px', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : 'Confirm Settlement'}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
