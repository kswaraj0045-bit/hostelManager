import { useEffect, useState } from 'react';
import { Pencil, Plus, ThumbsUp } from 'lucide-react';
import Loader from '../components/common/Loader.jsx';
import * as groupService from '../services/groupService.js';
import * as messService from '../services/messService.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../context/AuthContext.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getWeekStart = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  return value;
};

const formatDateOnly = (date) => {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDayIndex = () => {
  const today = new Date().getDay();
  return today === 0 ? 6 : today - 1;
};

const getMemberId = (member) => member?.user?._id?.toString?.() || member?.user?._id || '';

const getAdminId = (group) => group?.created_by?._id?.toString?.() || group?.created_by?.toString?.() || '';

const buildLaundrySchedule = (members, offset = 0) => {
  if (!members.length) return [];

  const entries = members.map((member) => ({
    member,
    days: [],
    isToday: false,
    isNext: false
  }));

  DAYS.forEach((day, index) => {
    const assignedIndex = (index + offset) % members.length;
    entries[assignedIndex].days.push(day);
  });

  const todayIndex = getTodayDayIndex();
  const todayAssignedIndex = (todayIndex + offset) % members.length;
  const nextAssignedIndex = ((todayIndex + 1) % DAYS.length + offset) % members.length;

  entries[todayAssignedIndex].isToday = true;
  entries[nextAssignedIndex].isNext = true;

  return entries;
};

export default function Mess() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [editingDay, setEditingDay] = useState('');
  const [draftMeal, setDraftMeal] = useState('');
  const [savingDay, setSavingDay] = useState('');
  const [votingDay, setVotingDay] = useState('');
  const [laundrySchedule, setLaundrySchedule] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [laundryOffset, setLaundryOffset] = useState(0);
  const { success, error } = useToast();
  const { user } = useAuth();

  const currentUserId = user?._id?.toString?.() || user?._id || '';
  const selectedGroupData = groups.find((group) => group._id === selectedGroup);
  const isAdmin = getAdminId(selectedGroupData) === currentUserId;
  const dayMap = new Map((menu?.days || []).map((item) => [item.day, item]));

  const loadMenu = async (groupId) => {
    setMenuLoading(true);
    try {
      const res = await messService.getMess(groupId);
      setMenu(res.data?.data || null);
    } catch (err) {
      setMenu(null);
      error(err.response?.data?.message || 'Failed to load menu');
    } finally {
      setMenuLoading(false);
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
    if (!selectedGroup) {
      setMenu(null);
      setGroupMembers([]);
      setLaundrySchedule([]);
      return;
    }

    const group = groups.find((item) => item._id === selectedGroup);
    setGroupMembers(group?.members || []);
    setLaundryOffset(0);
    setEditingDay('');
    setDraftMeal('');
    loadMenu(selectedGroup);
  }, [selectedGroup, groups]);

  useEffect(() => {
    setLaundrySchedule(buildLaundrySchedule(groupMembers, laundryOffset));
  }, [groupMembers, laundryOffset]);

  const handleStartEdit = (day) => {
    setEditingDay(day);
    setDraftMeal(dayMap.get(day)?.meal || '');
  };

  const handleCancelEdit = () => {
    setEditingDay('');
    setDraftMeal('');
  };

  const handleSaveDay = async (day) => {
    const meal = draftMeal.trim();
    if (!meal) {
      error('Meal is required');
      return;
    }

    setSavingDay(day);
    try {
      const days = DAYS
        .map((dayName) => {
          const existingMeal = dayMap.get(dayName)?.meal || '';
          const value = dayName === day ? meal : existingMeal;
          return value ? { day: dayName, meal: value } : null;
        })
        .filter(Boolean);

      const res = await messService.createOrUpdateMess({
        group_id: selectedGroup,
        week_start: formatDateOnly(menu?.week_start || getWeekStart(new Date())),
        days
      });

      setMenu(res.data?.data || null);
      success(dayMap.get(day)?.meal ? 'Meal updated' : 'Meal added');
      handleCancelEdit();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save menu');
    } finally {
      setSavingDay('');
    }
  };

  const handleVote = async (day) => {
    const dayIndex = menu?.days?.findIndex((item) => item.day === day);
    if (!menu?._id || dayIndex === undefined || dayIndex < 0) return;

    setVotingDay(day);
    try {
      const res = await messService.voteMeal(menu._id, dayIndex);
      setMenu(res.data?.data || null);
      success('Vote recorded');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to vote');
    } finally {
      setVotingDay('');
    }
  };

  const handleReassign = () => {
    if (!groupMembers.length) return;
    setLaundryOffset((current) => current + 1);
    success('Laundry rotation updated');
  };

  if (loading) return <Loader />;

  if (!groups.length) {
    return (
      <div className="fade-in">
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: '#A7A9BE' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px', marginBottom: '10px', color: '#FFFFFE' }}>Mess & Laundry</h1>
          <p>Create or join a group to manage weekly meals and laundry rotation.</p>
        </div>
      </div>
    );
  }

  const weekStart = menu?.week_start ? new Date(menu.week_start) : getWeekStart(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekRange = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px' }}>Mess & Laundry</h1>
          <p style={{ fontSize: '13px', color: '#A7A9BE', marginTop: '4px' }}>Week: {weekRange}</p>
        </div>

        <select
          value={selectedGroup}
          onChange={(event) => setSelectedGroup(event.target.value)}
          className="input-dark"
          style={{ width: 'auto', minWidth: '180px' }}
        >
          {groups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>This Week&apos;s Menu</h2>

        {menuLoading ? (
          <div className="glass" style={{ padding: '24px', textAlign: 'center', color: '#A7A9BE' }}>
            Loading menu...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {DAYS.map((day, index) => {
              const dayData = dayMap.get(day);
              const isToday = index === getTodayDayIndex();
              const isEditing = editingDay === day;
              const isSaving = savingDay === day;
              const isVoting = votingDay === day;

              return (
                <div key={day} className="glass" style={{ padding: '18px', borderRadius: '16px', borderColor: isToday ? 'rgba(108,99,255,0.4)' : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{day}</h3>
                      {isToday && (
                        <span style={{ fontSize: '11px', color: '#8E86FF', fontWeight: 700 }}>Today</span>
                      )}
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(day)}
                        style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#FFFFFE', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        {dayData?.meal ? <Pencil size={13} /> : <Plus size={13} />}
                        {dayData?.meal ? 'Edit' : 'Add'}
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input
                        type="text"
                        value={draftMeal}
                        onChange={(event) => setDraftMeal(event.target.value)}
                        className="input-dark"
                        placeholder="Enter meal"
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleSaveDay(day)}
                          disabled={isSaving}
                          className="gradient-btn"
                          style={{ padding: '9px 14px', borderRadius: '10px', fontSize: '13px', opacity: isSaving ? 0.7 : 1 }}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#A7A9BE', cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: '13px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ minHeight: '52px', display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
                        <p style={{ fontSize: '14px', color: dayData?.meal ? '#FFFFFE' : '#A7A9BE', fontWeight: dayData?.meal ? 600 : 400 }}>
                          {dayData?.meal || 'Not planned'}
                        </p>
                      </div>

                      {dayData?.meal && (
                        <button
                          onClick={() => handleVote(day)}
                          disabled={isVoting}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#FFFFFE', cursor: isVoting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isVoting ? 0.7 : 1 }}
                        >
                          <ThumbsUp size={14} />
                          {isVoting ? 'Saving...' : `${dayData?.votes?.length || 0} votes`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px' }}>Laundry Schedule</h2>
          {isAdmin && (
            <button
              onClick={handleReassign}
              style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#FFFFFE', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
            >
              Reassign
            </button>
          )}
        </div>

        {laundrySchedule.length === 0 ? (
          <div className="glass" style={{ padding: '24px', color: '#A7A9BE' }}>
            Add members to this group to generate a laundry rotation.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {laundrySchedule.map((entry) => {
              const memberId = getMemberId(entry.member);
              const memberName = entry.member?.user?.name || 'Unknown member';
              const initials = memberName.charAt(0).toUpperCase();
              const daysLabel = entry.days.length
                ? entry.days.map((day) => day.slice(0, 3)).join(', ')
                : 'No fixed day this week';

              return (
                <div
                  key={memberId}
                  style={{
                    padding: entry.isToday ? '1px' : 0,
                    borderRadius: '16px',
                    background: entry.isToday ? 'linear-gradient(135deg, #6C63FF, #FF6584)' : 'transparent'
                  }}
                >
                  <div className="glass" style={{ padding: '16px', borderRadius: '15px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFE', fontWeight: 700, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{memberName}</p>
                          <p style={{ fontSize: '13px', color: '#A7A9BE' }}>{daysLabel}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {entry.isToday && (
                          <span style={{ background: 'rgba(108,99,255,0.16)', color: '#8E86FF', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px' }}>
                            Today 🧺
                          </span>
                        )}
                        {entry.isNext && (
                          <span style={{ background: 'rgba(255,255,255,0.08)', color: '#FFFFFE', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px' }}>
                            Next
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
