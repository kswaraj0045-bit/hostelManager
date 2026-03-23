import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ChoreBoard from '../components/chores/ChoreBoard.jsx';
import ChoreForm from '../components/chores/ChoreForm.jsx';
import Modal from '../components/common/Modal.jsx';
import Loader from '../components/common/Loader.jsx';
import * as groupService from '../services/groupService.js';
import * as choreService from '../services/choreService.js';
import { useToast } from '../hooks/useToast.js';

export default function Chores() {
  const [groups, setGroups] = useState([]);
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { success, error } = useToast();

  const load = async () => {
    try {
      const gRes = await groupService.getGroups();
      const list = gRes.data?.data || [];
      setGroups(list);

      const all = [];
      for (const g of list) {
        const cRes = await choreService.getChores(g._id);
        (cRes.data?.data || []).forEach(c => all.push({ ...c, group_id: g }));
      }
      setChores(all);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (data) => {
    try {
      await choreService.addChore(data);
      success('Chore added');
      setShowForm(false);
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add chore');
      throw err;
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await choreService.updateChore(id, data);
      success('Chore updated');
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    try {
      await choreService.deleteChore(id);
      success('Chore deleted');
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <Loader />;

  const pending = chores.filter(c => c.status === 'pending');
  const done = chores.filter(c => c.status === 'done');
  const skipped = chores.filter(c => c.status === 'skipped');

  const columnConfig = [
    { key: 'pending', label: 'Pending', items: pending, color: '#FF8906', bg: 'rgba(255,137,6,0.1)' },
    { key: 'done', label: 'Done', items: done, color: '#2CB67D', bg: 'rgba(44,182,125,0.1)' },
    { key: 'skipped', label: 'Skipped', items: skipped, color: '#A7A9BE', bg: 'rgba(167,169,190,0.1)' },
  ];

  const isOverdue = (dateStr) => dateStr && new Date(dateStr) < new Date();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px' }}>Chore Board</h1>
        <button onClick={() => setShowForm(true)} className="gradient-btn" style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Add Chore
        </button>
      </div>

      {chores.length === 0 ? (
        <div className="glass" style={{ padding: '60px', textAlign: 'center', color: '#A7A9BE' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <p style={{ fontSize: '16px', fontWeight: 500 }}>No chores yet</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Add chores for your group members</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {columnConfig.map(col => (
            <div key={col.key}>
              <div className="glass" style={{ padding: '16px', marginBottom: '16px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '15px' }}>{col.label}</h2>
                  <span style={{ background: col.bg, color: col.color, fontWeight: 700, fontSize: '12px', padding: '2px 10px', borderRadius: '20px' }}>
                    {col.items.length}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.items.map(c => (
                  <div key={c._id} className="glass card-hover" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ fontWeight: 600, fontSize: '15px' }}>{c.title}</h3>
                      <button
                        onClick={() => handleDelete(c._id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#A7A9BE', padding: '2px', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#FF6584'}
                        onMouseLeave={e => e.currentTarget.style.color = '#A7A9BE'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                        {c.assigned_to?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span style={{ fontSize: '13px', color: '#A7A9BE' }}>{c.assigned_to?.name || 'Unassigned'}</span>
                    </div>
                    {c.due_date && (
                      <p style={{ fontSize: '12px', color: isOverdue(c.due_date) ? '#FF6584' : '#A7A9BE', marginBottom: '8px' }}>
                        Due {new Date(c.due_date).toLocaleDateString()}
                        {isOverdue(c.due_date) && ' (overdue)'}
                      </p>
                    )}
                    {c.recurrence && c.recurrence !== 'none' && (
                      <span style={{ fontSize: '11px', background: '#252436', color: '#A7A9BE', padding: '2px 8px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px' }}>
                        {c.recurrence}
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      {col.key === 'pending' && (
                        <button
                          onClick={() => handleUpdate(c._id, { status: 'done' })}
                          className="gradient-btn"
                          style={{ flex: 1, padding: '6px', borderRadius: '8px', fontSize: '12px', textAlign: 'center' }}
                        >
                          Mark Done
                        </button>
                      )}
                      {col.key === 'done' && (
                        <button
                          onClick={() => handleUpdate(c._id, { status: 'pending' })}
                          style={{ flex: 1, padding: '6px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A7A9BE', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {col.items.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#A7A9BE', fontSize: '13px' }}>
                    No {col.label.toLowerCase()} chores
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Chore" hideFooter>
        <ChoreForm groups={groups} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
