import { useState, useEffect } from 'react';
import { Plus, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import BillList from '../components/bills/BillList.jsx';
import BillForm from '../components/bills/BillForm.jsx';
import Modal from '../components/common/Modal.jsx';
import Loader from '../components/common/Loader.jsx';
import * as groupService from '../services/groupService.js';
import * as billService from '../services/billService.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../context/AuthContext.jsx';

function getBillIcon(title = '') {
  const t = title.toLowerCase();
  if (t.includes('electric') || t.includes('power') || t.includes('bill')) return { emoji: '⚡', color: '#FF8906' };
  if (t.includes('water') || t.includes('aqua')) return { emoji: '💧', color: '#0984E3' };
  if (t.includes('internet') || t.includes('wifi') || t.includes('network')) return { emoji: '📶', color: '#6C63FF' };
  if (t.includes('rent') || t.includes('house')) return { emoji: '🏠', color: '#2CB67D' };
  return { emoji: '📋', color: '#A7A9BE' };
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function DueBadge({ days, paid }) {
  if (paid) return <span style={{ background: 'rgba(44,182,125,0.2)', color: '#2CB67D', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600 }}>Paid ✓</span>;
  if (days === null) return null;
  if (days < 3) return <span style={{ background: 'rgba(255,101,132,0.2)', color: '#FF6584', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600 }}>Due soon!</span>;
  if (days <= 7) return <span style={{ background: 'rgba(255,137,6,0.2)', color: '#FF8906', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600 }}>{days}d left</span>;
  return <span style={{ background: 'rgba(167,169,190,0.1)', color: '#A7A9BE', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600 }}>{days}d left</span>;
}

export default function Bills() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPaid, setShowPaid] = useState(false);
  const { success, error } = useToast();
  const { user } = useAuth();
  const currentUserId = user?._id?.toString?.() || user?._id;

  const group = groups.find(g => g._id === selectedGroup);

  useEffect(() => {
    groupService.getGroups().then(res => {
      const list = res.data?.data || [];
      setGroups(list);
      if (list.length && !selectedGroup) setSelectedGroup(list[0]._id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;
    billService.getBills(selectedGroup).then(res => { setBills(res.data?.data || []); });
  }, [selectedGroup]);

  const reload = () => billService.getBills(selectedGroup).then(res => setBills(res.data?.data || []));

  const handleAdd = async (data) => {
    try {
      await billService.addBill(data);
      success('Bill added');
      setShowForm(false);
      reload();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add');
      throw err;
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await billService.updateBill(id, { paid: true });
      success('Bill marked paid');
      reload();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    try {
      await billService.deleteBill(id);
      success('Bill deleted');
      reload();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <Loader />;

  const unpaid = bills.filter(b => !b.paid);
  const paid = bills.filter(b => b.paid);

  const BillCard = ({ bill, dimmed = false }) => {
    const { emoji, color } = getBillIcon(bill.title);
    const days = daysUntil(bill.due_date);
    const assignedUserId = bill.assigned_to?._id?.toString?.() || bill.assigned_to?.toString?.() || '';
    const isAssignedUser = assignedUserId && assignedUserId === currentUserId;
    const canMarkPaid = !bill.paid && (!assignedUserId || isAssignedUser);
    const assignedLabel = assignedUserId
      ? (isAssignedUser ? 'You will pay this bill' : `${bill.assigned_to?.name || 'Another member'} will pay this bill`)
      : 'No payer assigned yet';
    const paidLabel = bill.paid_by?.name
      ? `Paid by ${bill.paid_by.name}`
      : 'Paid';

    return (
      <div className="glass card-hover" style={{ padding: '20px', opacity: dimmed ? 0.6 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
            {emoji}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>{bill.title}</h3>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '22px', color: '#FFFFFE' }}>₹{bill.amount}</p>
          </div>
        </div>
        {bill.due_date && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarDays size={13} color="#A7A9BE" />
              <span style={{ fontSize: '13px', color: '#A7A9BE' }}>{new Date(bill.due_date).toLocaleDateString()}</span>
            </div>
            <DueBadge days={days} paid={bill.paid} />
          </div>
        )}
        <p style={{ fontSize: '13px', color: bill.paid ? '#2CB67D' : '#A7A9BE', marginBottom: '12px' }}>
          {bill.paid ? paidLabel : assignedLabel}
        </p>
        {/* Member avatars */}
        {bill.split_among?.length > 0 && (
          <div style={{ display: 'flex', marginBottom: '12px' }}>
            {bill.split_among.slice(0, 4).map((m, i) => (
              <div key={m._id || i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: 700, marginLeft: i > 0 ? '-6px' : 0, border: '2px solid #1C1B29' }}>
                {m.name?.charAt(0).toUpperCase() || '?'}
              </div>
            ))}
          </div>
        )}
        {!bill.paid && canMarkPaid && (
          <button
            onClick={() => handleMarkPaid(bill._id)}
            className="gradient-btn"
            style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '13px' }}
          >
            Mark as Paid
          </button>
        )}
        {!bill.paid && !canMarkPaid && (
          <div style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '13px', textAlign: 'center', background: '#252436', color: '#A7A9BE' }}>
            Waiting for {bill.assigned_to?.name || 'assigned member'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px' }}>Bills</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="input-dark"
            style={{ width: 'auto', minWidth: '140px' }}
          >
            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} className="gradient-btn" style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Bill
          </button>
        </div>
      </div>

      {/* Unpaid bills */}
      <div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '16px', marginBottom: '16px', color: '#A7A9BE' }}>
          Unpaid ({unpaid.length})
        </h2>
        {unpaid.length === 0 ? (
          <div className="glass" style={{ padding: '40px', textAlign: 'center', color: '#A7A9BE' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
            <p>No unpaid bills!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {unpaid.map(b => <BillCard key={b._id} bill={b} />)}
          </div>
        )}
      </div>

      {/* Paid bills - collapsible */}
      {paid.length > 0 && (
        <div>
          <button
            onClick={() => setShowPaid(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#A7A9BE', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '16px', marginBottom: '16px', padding: 0 }}
          >
            Paid Bills ({paid.length})
            {showPaid ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showPaid && (
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {paid.map(b => <BillCard key={b._id} bill={b} dimmed />)}
            </div>
          )}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Bill" hideFooter>
        {group && <BillForm group={group} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />}
      </Modal>
    </div>
  );
}
