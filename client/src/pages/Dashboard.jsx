import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Users, Receipt, AlertCircle, CheckSquare, Zap } from 'lucide-react';
import Loader from '../components/common/Loader.jsx';
import * as expenseService from '../services/expenseService.js';
import * as groupService from '../services/groupService.js';
import * as choreService from '../services/choreService.js';
import * as billService from '../services/billService.js';
import * as aiService from '../services/aiService.js';
import { useAuth } from '../context/AuthContext.jsx';

function StatCard({ icon: Icon, iconColor = '#6C63FF', value, label }) {
  return (
    <div className="glass card-hover" style={{ padding: '24px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        <Icon size={22} color={iconColor} />
      </div>
      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '28px', color: '#FFFFFE', marginBottom: '4px' }}>{value}</p>
      <p style={{ fontSize: '13px', color: '#A7A9BE' }}>{label}</p>
    </div>
  );
}

function ClickableStatCard({ icon, iconColor, value, label, onClick }) {
  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      <StatCard icon={icon} iconColor={iconColor} value={value} label={label} />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [netBalance, setNetBalance] = useState(0);
  const [balanceDetails, setBalanceDetails] = useState([]);
  const [groups, setGroups] = useState([]);
  const [chores, setChores] = useState([]);
  const [bills, setBills] = useState([]);
  const [digest, setDigest] = useState(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const { user } = useAuth();

  const currentUserId = user?._id?.toString?.() || user?._id;

  const load = async () => {
    try {
      const [balanceRes, groupsRes, digestRes] = await Promise.all([
        expenseService.getOverallBalance(),
        groupService.getGroups(),
        aiService.getDigest()
      ]);

      const balanceData = balanceRes.data?.data || {};
      setNetBalance(balanceData.netBalance ?? 0);
      setBalanceDetails(balanceData.userBalances || []);
      setDigest(digestRes.data?.data);

      const groupList = groupsRes.data?.data || [];
      setGroups(groupList);

      const allChores = [];
      const allBills = [];

      for (const group of groupList) {
        const [choresRes, billsRes] = await Promise.all([
          choreService.getChores(group._id),
          billService.getBills(group._id)
        ]);

        (choresRes.data?.data || []).forEach((chore) => {
          allChores.push({ ...chore, group_id: group });
        });

        (billsRes.data?.data || []).forEach((bill) => {
          allBills.push({
            ...bill,
            group_id: bill.group_id || { _id: group._id, name: group.name }
          });
        });
      }

      setChores(allChores);
      setBills(allBills);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerateDigest = async () => {
    setDigestLoading(true);
    try {
      const res = await aiService.getDigest();
      setDigest(res.data?.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDigestLoading(false);
    }
  };

  if (loading) return <Loader />;

  const todayChore = chores.find((chore) => chore.status === 'pending');
  const unpaidBills = bills.filter((bill) => !bill.paid);
  const monthlyCost = bills.reduce((sum, bill) => sum + (bill.amount || 0), 0);

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const upcomingBill = [...unpaidBills].sort((left, right) => {
    const leftTime = left.due_date ? new Date(left.due_date).getTime() : Number.POSITIVE_INFINITY;
    const rightTime = right.due_date ? new Date(right.due_date).getTime() : Number.POSITIVE_INFINITY;
    return leftTime - rightTime;
  })[0];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px', marginBottom: '4px' }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ color: '#A7A9BE', fontSize: '14px' }}>Here is what is happening in your hostel today.</p>
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <ClickableStatCard
          icon={Wallet}
          iconColor={netBalance >= 0 ? '#2CB67D' : '#FF6584'}
          value={`Rs ${Math.abs(netBalance).toFixed(0)}`}
          label={netBalance >= 0 ? 'Net (you are owed)' : 'Net (you owe)'}
          onClick={() => navigate('/groups')}
        />
        <ClickableStatCard icon={Users} iconColor="#6C63FF" value={groups.length} label="Active Groups" onClick={() => navigate('/groups')} />
        <ClickableStatCard icon={Receipt} iconColor="#FF8906" value={`Rs ${monthlyCost.toFixed(0)}`} label="Total Bills" onClick={() => navigate('/bills')} />
        <ClickableStatCard icon={AlertCircle} iconColor="#FF6584" value={unpaidBills.length} label="Pending Bills" onClick={() => navigate('/bills')} />
      </div>

      <div className="glass" style={{ padding: '24px' }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
          Who Owes What
        </h2>
        {balanceDetails.length === 0 ? (
          <p style={{ color: '#A7A9BE', fontSize: '14px' }}>All settled up right now.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {balanceDetails.map((item) => (
              <div key={`${item.direction}-${item.otherUserId}`} style={{ background: '#252436', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="gradient-bg" style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                  {item.otherUserName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                    {item.direction === 'you_owe'
                      ? `You owe ${item.otherUserName}`
                      : `${item.otherUserName} owes you`}
                  </p>
                  <p style={{ fontSize: '12px', color: '#A7A9BE' }}>Across all your shared expenses</p>
                </div>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', color: item.direction === 'you_owe' ? '#FF6584' : '#2CB67D' }}>
                  Rs {item.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 300px' }} className="lg:grid-cols-[1fr_300px] md:grid-cols-1">
        <div className="glass" style={{ padding: '24px' }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            Recent Activity
          </h2>
          {chores.length === 0 && bills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#A7A9BE' }}>
              <p>No recent activity</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bills.slice(0, 5).map((bill) => (
                <div key={bill._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: '#252436' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: bill.paid ? '#2CB67D' : '#FF8906', flexShrink: 0 }} />
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                    B
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontWeight: 500, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {bill.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#A7A9BE' }}>
                      {bill.paid
                        ? `Paid by ${bill.paid_by?.name || 'member'}`
                        : `Payer: ${bill.assigned_to?._id === currentUserId ? 'You' : (bill.assigned_to?.name || 'Unassigned')}`}
                    </p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: bill.paid ? '#2CB67D' : '#FF6584' }}>
                    Rs {bill.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <CheckSquare size={18} color="#6C63FF" />
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '15px' }}>
                Today's Chore
              </h3>
            </div>
            {todayChore ? (
              <>
                <p style={{ fontWeight: 600, marginBottom: '4px' }}>{todayChore.title}</p>
                <p style={{ fontSize: '12px', color: '#A7A9BE' }}>
                  Assigned to {todayChore.assigned_to?.name || 'Unknown'}
                </p>
              </>
            ) : (
              <p style={{ color: '#A7A9BE', fontSize: '14px' }}>No chores pending.</p>
            )}
          </div>

          <div className="glass" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Zap size={18} color="#FF8906" />
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '15px' }}>
                Upcoming Bill
              </h3>
            </div>
            {upcomingBill ? (
              <>
                <p style={{ fontWeight: 600, marginBottom: '4px' }}>{upcomingBill.title}</p>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '20px', color: '#FFFFFE', marginBottom: '4px' }}>
                  Rs {upcomingBill.amount}
                </p>
                <p style={{ fontSize: '12px', color: '#A7A9BE', marginBottom: '4px' }}>
                  {upcomingBill.assigned_to?._id === currentUserId
                    ? 'Assigned to you'
                    : `Assigned to ${upcomingBill.assigned_to?.name || 'Unassigned'}`}
                </p>
                {upcomingBill.group_id?.name && (
                  <p style={{ fontSize: '12px', color: '#A7A9BE', marginBottom: '4px' }}>
                    Group: {upcomingBill.group_id.name}
                  </p>
                )}
                <p style={{ fontSize: '12px', color: daysUntil(upcomingBill.due_date) < 3 ? '#FF6584' : '#A7A9BE' }}>
                  {upcomingBill.due_date
                    ? `Due ${new Date(upcomingBill.due_date).toLocaleDateString()}`
                    : 'No due date'}
                </p>
              </>
            ) : (
              <p style={{ color: '#A7A9BE', fontSize: '14px' }}>No upcoming bills.</p>
            )}
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: '24px', borderColor: 'rgba(108,99,255,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div className="gradient-bg" style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
            AI
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px' }}>
            Weekly Digest
          </h2>
        </div>
        {digest ? (
          <p style={{ color: '#A7A9BE', fontSize: '14px', lineHeight: 1.7, marginBottom: '16px' }}>
            {typeof digest === 'string' ? digest : digest.content || JSON.stringify(digest)}
          </p>
        ) : (
          <p style={{ color: '#A7A9BE', fontSize: '14px', marginBottom: '16px' }}>
            Generate a weekly summary of your hostel activity, expenses, and chores.
          </p>
        )}
        <button
          onClick={handleGenerateDigest}
          disabled={digestLoading}
          className="gradient-btn"
          style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {digestLoading ? 'Generating...' : 'Generate Digest'}
        </button>
      </div>
    </div>
  );
}
