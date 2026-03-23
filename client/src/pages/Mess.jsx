import { useState, useEffect } from 'react';
import { Pencil, ThumbsUp } from 'lucide-react';
import MessMenu from '../components/mess/MessMenu.jsx';
import MenuVoting from '../components/mess/MenuVoting.jsx';
import LaundryTracker from '../components/mess/LaundryTracker.jsx';
import Loader from '../components/common/Loader.jsx';
import * as groupService from '../services/groupService.js';
import * as messService from '../services/messService.js';
import { useToast } from '../hooks/useToast.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Mess() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    groupService.getGroups().then(res => {
      const list = res.data?.data || [];
      setGroups(list);
      if (list.length && !selectedGroup) setSelectedGroup(list[0]._id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;
    messService.getMess(selectedGroup).then(res => {
      setMenu(res.data?.data);
    }).catch(() => setMenu(null));
  }, [selectedGroup]);

  const handleSaveMenu = async (data) => {
    try {
      await messService.createOrUpdateMess({
        group_id: selectedGroup,
        days: data.days,
        week_start: new Date()
      });
      success('Menu saved');
      setShowForm(false);
      messService.getMess(selectedGroup).then(res => setMenu(res.data?.data));
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save');
      throw err;
    }
  };

  const handleVote = async (dayIndex) => {
    try {
      const res = await messService.voteMeal(menu._id, dayIndex);
      setMenu(res.data?.data);
      success('Vote recorded');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to vote');
    }
  };

  if (loading) return <Loader />;

  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayDayIndex = today === 0 ? 6 : today - 1;

  const weekStart = menu?.week_start ? new Date(menu.week_start) : new Date();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekRange = `${weekStart.toLocaleDateString()} – ${weekEnd.toLocaleDateString()}`;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px' }}>Mess & Laundry</h1>
          {menu && <p style={{ fontSize: '13px', color: '#A7A9BE', marginTop: '2px' }}>Week: {weekRange}</p>}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="input-dark"
            style={{ width: 'auto', minWidth: '140px' }}
          >
            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            className="gradient-btn"
            style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Pencil size={14} /> Set Menu
          </button>
        </div>
      </div>

      {/* Menu form if shown */}
      {showForm && (
        <div className="glass" style={{ padding: '24px' }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>Set Weekly Menu</h2>
          <MenuVoting onSubmit={handleSaveMenu} />
        </div>
      )}

      {/* Day grid */}
      <div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>This Week's Menu</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
          {DAYS.map((day, idx) => {
            const dayData = menu?.days?.[idx];
            const isToday = idx === todayDayIndex;
            return (
              <div key={day} className="glass" style={{ padding: '14px', borderRadius: '14px', borderColor: isToday ? 'rgba(108,99,255,0.4)' : undefined }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '13px', padding: '4px 8px', borderRadius: '8px', textAlign: 'center', marginBottom: '10px', background: isToday ? 'linear-gradient(135deg, #6C63FF, #FF6584)' : '#252436', color: isToday ? 'white' : '#A7A9BE' }}>
                  {day.slice(0, 3)}
                </div>
                <p style={{ fontSize: '13px', color: dayData?.meal ? '#FFFFFE' : '#A7A9BE', textAlign: 'center', fontWeight: dayData?.meal ? 500 : 400, marginBottom: '10px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {dayData?.meal || 'Not planned'}
                </p>
                {menu && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <button
                      onClick={() => handleVote(idx)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#A7A9BE', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', padding: '4px', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#6C63FF'}
                      onMouseLeave={e => e.currentTarget.style.color = '#A7A9BE'}
                    >
                      <ThumbsUp size={12} />
                      <span>{dayData?.votes?.length || 0}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Laundry */}
      <div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>Laundry Schedule</h2>
        <div className="glass" style={{ padding: '24px' }}>
          <LaundryTracker />
        </div>
      </div>
    </div>
  );
}
