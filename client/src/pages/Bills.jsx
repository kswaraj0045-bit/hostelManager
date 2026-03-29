import { useEffect, useState } from 'react';
import { Plus, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import BillForm from '../components/bills/BillForm.jsx';
import Modal from '../components/common/Modal.jsx';
import Loader from '../components/common/Loader.jsx';
import * as groupService from '../services/groupService.js';
import * as billService from '../services/billService.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../context/AuthContext.jsx';

function getBillIcon(title = '') {
  const value = title.toLowerCase();
  if (value.includes('electric') || value.includes('power') || value.includes('bill')) return { emoji: '⚡', color: '#FF8906' };
  if (value.includes('water') || value.includes('aqua')) return { emoji: '💧', color: '#0984E3' };
  if (value.includes('internet') || value.includes('wifi') || value.includes('network')) return { emoji: '📶', color: '#6C63FF' };
  if (value.includes('rent') || value.includes('house')) return { emoji: '🏠', color: '#2CB67D' };
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

const getAdminId = (group) => group?.created_by?._id?.toString?.() || group?.created_by?.toString?.() || '';

export default function Bills() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPaid, setShowPaid] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const { success, error } = useToast();
  const { user } = useAuth();

  const currentUserId = user?._id?.toString?.() || user?._id || '';
  const group = groups.find((item) => item._id === selectedGroup);
  const isAdmin = getAdminId(group) === currentUserId;

  const setActionState = (key, value) => {
    setActionLoading((current) => ({ ...current, [key]: value }));
  };

  const loadBills = async (groupId) => {
    if (!groupId) {
      setBills([]);
      return;
    }

    try {
      const res = await billService.getBills(groupId);
      setBills(res.data?.data || []);
    } catch (err) {
      setBills([]);
      error(err.response?.data?.message || 'Failed to load bills');
    }
  };

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await groupService.getGroups();
        const list = res.data?.data || [];
        setGroups(list);
        if (list.length) {
          setSelectedGroup((current) => current || list[0]._id);
        }
      } catch (err) {
        error(err.response?.data?.message || 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;
    loadBills(selectedGroup);
  }, [selectedGroup]);

  const handleAdd = async (data) => {
    setFormSubmitting(true);
    try {
      await billService.addBill(data);
      success('Bill added');
      setShowForm(false);
      await loadBills(selectedGroup);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleMarkPaid = async (bill) => {
    const actionKey = `pay-${bill._id}`;
    setActionState(actionKey, true);

    try {
      const res = await billService.updateBill(bill._id, { paid: true });
      const updated = res.data?.data;
      success(updated?.paymentRequested ? 'Payment request sent' : 'Bill marked paid');
      await loadBills(selectedGroup);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update');
    } finally {
      setActionState(actionKey, false);
    }
  };

  const handleApprove = async (bill) => {
    const actionKey = `approve-${bill._id}`;
    setActionState(actionKey, true);

    try {
      await billService.approveBillPayment(bill._id);
      success('Payment approved');
      await loadBills(selectedGroup);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionState(actionKey, false);
    }
  };

  const handleReject = async (bill) => {
    const actionKey = `reject-${bill._id}`;
    setActionState(actionKey, true);

    try {
      await billService.rejectBillPayment(bill._id);
      success('Payment request rejected');
      await loadBills(selectedGroup);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionState(actionKey, false);
    }
  };

  if (loading) return <Loader />;

  const unpaid = bills.filter((bill) => !bill.paid);
  const paid = bills.filter((bill) => bill.paid);
  const paymentRequests = bills.filter((bill) => !bill.paid && bill.paymentRequested);

  const BillCard = ({ bill, dimmed = false }) => {
    const { emoji, color } = getBillIcon(bill.title);
    const days = daysUntil(bill.due_date);
    const assignedUserId = bill.assigned_to?._id?.toString?.() || bill.assigned_to?.toString?.() || '';
    const isAssignedUser = assignedUserId && assignedUserId === currentUserId;
    const canRequestPayment = !bill.paid && !bill.paymentRequested && (!assignedUserId || isAssignedUser);
    const actionKey = `pay-${bill._id}`;
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

        {bill.paymentRequested && (
          <div style={{ marginBottom: '12px' }}>
            <span style={{ background: 'rgba(255,137,6,0.18)', color: '#FFB566', fontSize: '11px', padding: '4px 10px', borderRadius: '999px', fontWeight: 700 }}>
              Pending Approval ⏳
            </span>
            {bill.paymentRequestedBy?.name && (
              <p style={{ fontSize: '12px', color: '#A7A9BE', marginTop: '8px' }}>
                Requested by {bill.paymentRequestedBy.name}
              </p>
            )}
          </div>
        )}

        {bill.split_among?.length > 0 && (
          <div style={{ display: 'flex', marginBottom: '12px' }}>
            {bill.split_among.slice(0, 4).map((member, index) => (
              <div key={member._id || index} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: 700, marginLeft: index > 0 ? '-6px' : 0, border: '2px solid #1C1B29' }}>
                {member.name?.charAt(0).toUpperCase() || '?'}
              </div>
            ))}
          </div>
        )}

        {!bill.paid && isAdmin && !bill.paymentRequested && (
          <button
            onClick={() => handleMarkPaid(bill)}
            disabled={actionLoading[actionKey]}
            className="gradient-btn"
            style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '13px', opacity: actionLoading[actionKey] ? 0.7 : 1 }}
          >
            {actionLoading[actionKey] ? 'Saving...' : 'Mark as Paid'}
          </button>
        )}

        {!bill.paid && !isAdmin && canRequestPayment && (
          <button
            onClick={() => handleMarkPaid(bill)}
            disabled={actionLoading[actionKey]}
            className="gradient-btn"
            style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '13px', opacity: actionLoading[actionKey] ? 0.7 : 1 }}
          >
            {actionLoading[actionKey] ? 'Requesting...' : 'Request Payment'}
          </button>
        )}

        {!bill.paid && !isAdmin && !bill.paymentRequested && !canRequestPayment && (
          <div style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '13px', textAlign: 'center', background: '#252436', color: '#A7A9BE' }}>
            Waiting for {bill.assigned_to?.name || 'assigned member'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px' }}>Bills</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedGroup}
            onChange={(event) => setSelectedGroup(event.target.value)}
            className="input-dark"
            style={{ width: 'auto', minWidth: '140px' }}
          >
            {groups.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} className="gradient-btn" style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Bill
          </button>
        </div>
      </div>

      {isAdmin && paymentRequests.length > 0 && (
        <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px' }}>Payment Requests ({paymentRequests.length})</h2>
            <span style={{ fontSize: '12px', color: '#A7A9BE' }}>Admin action required</span>
          </div>

          {paymentRequests.map((bill) => {
            const approveKey = `approve-${bill._id}`;
            const rejectKey = `reject-${bill._id}`;

            return (
              <div key={bill._id} style={{ padding: '16px', borderRadius: '14px', background: '#252436', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{bill.title} • ₹{bill.amount}</p>
                  <p style={{ fontSize: '13px', color: '#A7A9BE' }}>
                    {bill.paymentRequestedBy?.name || 'A member'} requested payment
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleApprove(bill)}
                    disabled={actionLoading[approveKey]}
                    className="gradient-btn"
                    style={{ padding: '9px 14px', borderRadius: '10px', fontSize: '13px', opacity: actionLoading[approveKey] ? 0.7 : 1 }}
                  >
                    {actionLoading[approveKey] ? 'Approving...' : 'Approve ✅'}
                  </button>
                  <button
                    onClick={() => handleReject(bill)}
                    disabled={actionLoading[rejectKey]}
                    style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(255,101,132,0.35)', background: 'rgba(255,101,132,0.12)', color: '#FF6584', cursor: actionLoading[rejectKey] ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: actionLoading[rejectKey] ? 0.7 : 1 }}
                  >
                    {actionLoading[rejectKey] ? 'Rejecting...' : 'Reject ❌'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
            {unpaid.map((bill) => <BillCard key={bill._id} bill={bill} />)}
          </div>
        )}
      </div>

      {paid.length > 0 && (
        <div>
          <button
            onClick={() => setShowPaid((value) => !value)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#A7A9BE', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '16px', marginBottom: '16px', padding: 0 }}
          >
            Paid Bills ({paid.length})
            {showPaid ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showPaid && (
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {paid.map((bill) => <BillCard key={bill._id} bill={bill} dimmed />)}
            </div>
          )}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Bill" hideFooter>
        {group && <BillForm group={group} onSubmit={handleAdd} onCancel={() => setShowForm(false)} submitting={formSubmitting} />}
      </Modal>
    </div>
  );
}
