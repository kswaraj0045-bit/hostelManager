import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X } from 'lucide-react';
import GroupCard from '../components/groups/GroupCard.jsx';
import GroupForm from '../components/groups/GroupForm.jsx';
import InviteModal from '../components/groups/InviteModal.jsx';
import Modal from '../components/common/Modal.jsx';
import Loader from '../components/common/Loader.jsx';
import * as groupService from '../services/groupService.js';
import * as expenseService from '../services/expenseService.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState(null);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [search, setSearch] = useState('');
  const { success, error } = useToast();
  const { user } = useAuth();
  const userId = user?._id?.toString?.() || user?._id;
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await groupService.getGroups();
      const list = res.data?.data || [];
      setGroups(list);

      const netMap = {};
      for (const g of list) {
        try {
          const bRes = await expenseService.getBalance(g._id);
          const balancesList = bRes.data?.data || [];
          let net = 0;
          balancesList.forEach(b => {
            if (b.owes === userId) net -= b.amount;
            else if (b.owed === userId) net += b.amount;
          });
          netMap[g._id] = net;
        } catch (_) {}
      }
      setBalances(netMap);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleJoin = async (e) => {
    e?.preventDefault();
    if (!joinCode.trim()) return;
    try {
      await groupService.joinGroup(joinCode.trim().toUpperCase());
      success('Joined group');
      setShowJoin(false);
      setJoinCode('');
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Invalid invite code');
    }
  };

  const handleCreate = async (data) => {
    try {
      await groupService.createGroup(data);
      success('Group created');
      setShowForm(false);
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create group');
      throw err;
    }
  };

  const groupTypeConfig = {
    hostel: { gradient: 'linear-gradient(135deg, #6C63FF, #4834D4)', emoji: '🏠' },
    trip: { gradient: 'linear-gradient(135deg, #FF8906, #FF6584)', emoji: '✈️' },
    friends: { gradient: 'linear-gradient(135deg, #2CB67D, #0984E3)', emoji: '👫' },
    family: { gradient: 'linear-gradient(135deg, #FF6584, #A29BFE)', emoji: '👨‍👩‍👧' },
    other: { gradient: 'linear-gradient(135deg, #6C63FF, #FF6584)', emoji: '📦' },
  };

  const filtered = groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loader />;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px' }}>My Groups</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px' }}>
            <Search size={16} color="#A7A9BE" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search groups..."
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#FFFFFE', fontSize: '14px', width: '160px' }}
            />
          </div>
          <button
            onClick={() => setShowJoin(!showJoin)}
            style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A7A9BE', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#FFFFFE'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#A7A9BE'; }}
          >
            Join with Code
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="gradient-btn"
            style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Create Group
          </button>
        </div>
      </div>

      {/* Join code input */}
      {showJoin && (
        <div className="glass" style={{ padding: '20px' }}>
          <h2 style={{ fontWeight: 600, fontSize: '15px', marginBottom: '12px' }}>Join a Group</h2>
          <form onSubmit={handleJoin} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code (e.g. ABC123)"
              className="input-dark"
              style={{ flex: 1, minWidth: '200px' }}
            />
            <button type="submit" className="gradient-btn" style={{ padding: '12px 20px', borderRadius: '12px', fontSize: '14px' }}>Join</button>
            <button type="button" onClick={() => { setShowJoin(false); setJoinCode(''); }} style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A7A9BE', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Groups grid */}
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#A7A9BE' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏘️</div>
            <p style={{ fontSize: '16px', fontWeight: 500 }}>No groups yet</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Create or join a group to get started</p>
          </div>
        )}
        {filtered.map(g => {
          const cfg = groupTypeConfig[g.type] || groupTypeConfig.other;
          const net = balances[g._id] ?? 0;
          return (
            <div key={g._id} className="glass card-hover" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/groups/${g._id}`)}>
              {/* Banner */}
              <div style={{ height: '96px', background: cfg.gradient, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '40px' }}>{cfg.emoji}</span>
                <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize' }}>
                  {g.type || 'other'}
                </span>
              </div>
              {/* Body */}
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '17px', marginBottom: '4px' }}>{g.name}</h3>
                <p style={{ fontSize: '13px', color: '#A7A9BE', marginBottom: '16px' }}>{g.members?.length || 0} members</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  {/* Member avatars */}
                  <div style={{ display: 'flex' }}>
                    {(g.members || []).slice(0, 4).map((m, i) => (
                      <div key={m.user?._id || i} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 700, marginLeft: i > 0 ? '-8px' : 0, border: '2px solid #1C1B29' }}>
                        {m.user?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: net >= 0 ? '#2CB67D' : '#FF6584' }}>
                    {net >= 0 ? '+' : ''}₹{net.toFixed(0)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="gradient-btn"
                    style={{ flex: 1, padding: '8px', borderRadius: '10px', fontSize: '13px', textAlign: 'center' }}
                    onClick={e => { e.stopPropagation(); navigate(`/groups/${g._id}`); }}
                  >
                    View Group
                  </button>
                  <button
                    style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A7A9BE', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}
                    onClick={e => { e.stopPropagation(); setShowInvite(g); }}
                    onMouseEnter={e => e.currentTarget.style.color = '#FFFFFE'}
                    onMouseLeave={e => e.currentTarget.style.color = '#A7A9BE'}
                  >
                    Invite
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Group" hideFooter>
        <GroupForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </Modal>

      <InviteModal
        open={!!showInvite}
        onClose={() => setShowInvite(null)}
        inviteCode={showInvite?.invite_code}
      />
    </div>
  );
}
