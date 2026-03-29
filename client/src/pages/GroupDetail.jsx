import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Copy, Trash2, CheckCircle, AlertTriangle, MessageSquare, ShoppingCart } from 'lucide-react';
import ExpenseList from '../components/expenses/ExpenseList.jsx';
import ExpenseForm from '../components/expenses/ExpenseForm.jsx';
import SplitSummary from '../components/expenses/SplitSummary.jsx';
import Modal from '../components/common/Modal.jsx';
import Loader from '../components/common/Loader.jsx';
import GroupChat from './GroupChat.jsx';
import ShoppingList from './ShoppingList.jsx';
import * as groupService from '../services/groupService.js';
import * as expenseService from '../services/expenseService.js';
import { useSocket } from '../hooks/useSocket.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../context/AuthContext.jsx';

const GROUP_TYPE = {
  hostel: { gradient: 'linear-gradient(135deg, #6C63FF, #4834D4)', emoji: '🏠' },
  trip: { gradient: 'linear-gradient(135deg, #FF8906, #FF6584)', emoji: '✈️' },
  friends: { gradient: 'linear-gradient(135deg, #2CB67D, #0984E3)', emoji: '👫' },
  family: { gradient: 'linear-gradient(135deg, #FF6584, #A29BFE)', emoji: '👨‍👩‍👧' },
  other: { gradient: 'linear-gradient(135deg, #6C63FF, #FF6584)', emoji: '📦' },
};

const TABS = ['Expenses', 'Balances', 'Members', 'Chat', 'Shopping'];

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { joinGroup, leaveGroup, socket } = useSocket();
  const { success, error } = useToast();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [activeTab, setActiveTab] = useState('Expenses');
  const [copied, setCopied] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState('');

  const load = async () => {
    try {
      const [gRes, eRes, bRes] = await Promise.all([
        groupService.getGroup(id),
        expenseService.getExpenses(id),
        expenseService.getBalance(id)
      ]);
      setGroup(gRes.data?.data);
      setExpenses(eRes.data?.data || []);
      setBalances(bRes.data?.data || []);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    joinGroup(id);
    return () => leaveGroup(id);
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    socket.on('expense:added', (data) => {
      const gid = data.group_id?._id || data.group_id;
      if (gid?.toString() === id) setExpenses(prev => [data, ...prev]);
    });
    return () => socket.off('expense:added');
  }, [socket, id]);

  const handleAddExpense = async (data) => {
    await expenseService.addExpense(data);
    success('Expense added');
    setShowExpenseForm(false);
    load();
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await expenseService.deleteExpense(expenseId);
      success('Expense deleted');
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const userId = user?._id?.toString?.() || user?._id;
  const userMap = {};
  group?.members?.forEach(m => (userMap[m.user._id?.toString?.() || m.user._id] = m.user.name));
  const adminId = group?.created_by?._id?.toString?.() || group?.created_by?.toString?.() || '';
  const isAdmin = adminId === userId;

  const cfg = GROUP_TYPE[group?.type] || GROUP_TYPE.other;

  const copyInvite = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRemoveMember = async (member) => {
    const memberId = member?.user?._id?.toString?.() || member?.user?._id;
    const memberName = member?.user?.name || 'this member';

    if (!memberId || removingMemberId) return;

    const confirmed = window.confirm(`Are you sure you want to remove ${memberName}?`);
    if (!confirmed) return;

    setRemovingMemberId(memberId);
    try {
      await groupService.removeGroupMember(id, memberId);
      success('Member removed');
      await load();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingMemberId('');
    }
  };

  if (loading) return <Loader />;

  const tabs = isAdmin ? [...TABS, 'History'] : TABS;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Banner */}
      <div style={{ height: '160px', background: cfg.gradient, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>{cfg.emoji}</div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px', color: 'white', marginBottom: '4px' }}>{group?.name}</h1>
        <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '12px', fontWeight: 600, padding: '3px 12px', borderRadius: '20px' }}>
          {group?.members?.length || 0} members
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '4px', flexWrap: 'wrap' }}>
        <button className="gradient-btn" style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowExpenseForm(true)}>
          <Plus size={16} /> Add Expense
        </button>
        <button
          onClick={() => navigate(`/settle/${id}`)}
          style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#FFFFFE', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(108,99,255,0.5)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
        >
          <ArrowRight size={16} /> Settle Up
        </button>
        <button
          onClick={copyInvite}
          style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#FFFFFE', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
        >
          <Copy size={14} /> {copied ? 'Copied!' : `Invite (${group?.invite_code})`}
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0', background: '#252436', borderRadius: '12px', padding: '4px', marginBottom: '20px', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: '1 1 auto', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s', minWidth: 'max-content',
              background: activeTab === tab ? 'linear-gradient(135deg, #6C63FF, #FF6584)' : 'transparent',
              color: activeTab === tab ? 'white' : '#A7A9BE',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Expenses' && (
        <div>
          {expenses.length === 0 ? (
            <div className="glass" style={{ padding: '60px', textAlign: 'center', color: '#A7A9BE' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💸</div>
              <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>No expenses yet</p>
              <button className="gradient-btn" style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '14px' }} onClick={() => setShowExpenseForm(true)}>
                Add First Expense
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'Balances' && (
        <div>
          <SplitSummary balances={balances} currentUserId={userId} userMap={userMap} />
          {balances.length === 0 && (
            <div className="glass" style={{ padding: '40px', textAlign: 'center', color: '#A7A9BE' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
              <p style={{ fontSize: '16px', fontWeight: 500 }}>All settled up!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', color: '#A7A9BE', marginBottom: '4px' }}>Invite Code</p>
              <p style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, letterSpacing: '4px', color: '#6C63FF' }}>{group?.invite_code}</p>
            </div>
            <button onClick={copyInvite} className="gradient-btn" style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {(group?.members || []).map((member) => {
            const memberId = member?.user?._id?.toString?.() || member?.user?._id;
            const memberName = member?.user?.name || 'Unknown member';
            const memberEmail = member?.user?.email || 'No email';
            const isGroupAdminMember = memberId === adminId;
            const canRemove = isAdmin && memberId !== userId;
            const isRemoving = removingMemberId === memberId;

            return (
              <div key={memberId} className="glass" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                  {member?.user?.avatar ? (
                    <img
                      src={member.user.avatar.startsWith('http') ? member.user.avatar : `${import.meta.env.VITE_API_URL}${member.user.avatar}`}
                      alt={memberName}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFE', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                      {memberName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{memberName}</p>
                    <p style={{ fontSize: '13px', color: '#A7A9BE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{memberEmail}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ background: isGroupAdminMember ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.06)', color: isGroupAdminMember ? '#8E86FF' : '#A7A9BE', fontSize: '12px', fontWeight: 700, padding: '5px 10px', borderRadius: '999px' }}>
                    {isGroupAdminMember ? 'Admin' : 'Member'}
                  </span>
                  {canRemove && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      disabled={isRemoving}
                      style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,101,132,0.35)', background: 'rgba(255,101,132,0.12)', color: '#FF6584', cursor: isRemoving ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, opacity: isRemoving ? 0.7 : 1 }}
                    >
                      {isRemoving ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'History' && (
        <div className="glass" style={{ padding: '24px' }}>
          <p style={{ color: '#A7A9BE', fontSize: '14px' }}>Full activity history for group admins will appear here.</p>
        </div>
      )}

      {activeTab === 'Chat' && (
        <GroupChat groupId={id} groupName={group?.name} members={group?.members || []} />
      )}

      {activeTab === 'Shopping' && (
        <ShoppingList groupIdProp={id} />
      )}

      <Modal open={showExpenseForm} onClose={() => setShowExpenseForm(false)} title="Add Expense" hideFooter>
        <ExpenseForm
          group={group}
          onSubmit={handleAddExpense}
          onCancel={() => setShowExpenseForm(false)}
        />
      </Modal>
    </div>
  );
}
