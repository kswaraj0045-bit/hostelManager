import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ChoreForm from '../components/chores/ChoreForm.jsx';
import Modal from '../components/common/Modal.jsx';
import Loader from '../components/common/Loader.jsx';
import * as groupService from '../services/groupService.js';
import * as choreService from '../services/choreService.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../context/AuthContext.jsx';

const getAdminId = (group) => group?.created_by?._id?.toString?.() || group?.created_by?.toString?.() || '';

export default function Chores() {
  const [groups, setGroups] = useState([]);
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const { success, error } = useToast();
  const { user } = useAuth();

  const currentUserId = user?._id?.toString?.() || user?._id || '';

  const isAdminOfGroup = (group) => getAdminId(group) === currentUserId;

  const setActionState = (key, value) => {
    setActionLoading((current) => ({ ...current, [key]: value }));
  };

  const load = async (showLoader = true) => {
    if (showLoader) setLoading(true);

    try {
      const gRes = await groupService.getGroups();
      const list = gRes.data?.data || [];
      setGroups(list);

      const choreGroups = await Promise.all(
        list.map(async (group) => {
          const cRes = await choreService.getChores(group._id);
          return (cRes.data?.data || []).map((chore) => ({ ...chore, group_id: group }));
        })
      );

      setChores(choreGroups.flat());
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (data) => {
    setFormSubmitting(true);
    try {
      await choreService.addChore(data);
      success('Chore added');
      setShowForm(false);
      await load(false);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add chore');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const actionKey = `delete-${id}`;
    setActionState(actionKey, true);

    try {
      await choreService.deleteChore(id);
      success('Chore deleted');
      await load(false);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setActionState(actionKey, false);
    }
  };

  const handleRequestCompletion = async (chore) => {
    const actionKey = `request-${chore._id}`;
    setActionState(actionKey, true);

    try {
      const res = await choreService.updateChore(chore._id, { status: 'done' });
      const updated = res.data?.data;
      success(updated?.completionRequested ? 'Completion request sent' : 'Chore marked done');
      await load(false);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update');
    } finally {
      setActionState(actionKey, false);
    }
  };

  const handleUndo = async (chore) => {
    const actionKey = `undo-${chore._id}`;
    setActionState(actionKey, true);

    try {
      await choreService.updateChore(chore._id, { status: 'pending' });
      success('Chore updated');
      await load(false);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update');
    } finally {
      setActionState(actionKey, false);
    }
  };

  const handleApprove = async (chore) => {
    const actionKey = `approve-${chore._id}`;
    setActionState(actionKey, true);

    try {
      await choreService.approveChoreCompletion(chore._id);
      success('Chore approved');
      await load(false);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionState(actionKey, false);
    }
  };

  const handleReject = async (chore) => {
    const actionKey = `reject-${chore._id}`;
    setActionState(actionKey, true);

    try {
      await choreService.rejectChoreCompletion(chore._id);
      success('Chore request rejected');
      await load(false);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionState(actionKey, false);
    }
  };

  if (loading) return <Loader />;

  const pending = chores.filter((chore) => chore.status === 'pending');
  const done = chores.filter((chore) => chore.status === 'done');
  const skipped = chores.filter((chore) => chore.status === 'skipped');
  const awaitingApproval = chores.filter((chore) => chore.completionRequested && isAdminOfGroup(chore.group_id));

  const columnConfig = [
    { key: 'pending', label: 'Pending', items: pending, color: '#FF8906', bg: 'rgba(255,137,6,0.1)' },
    { key: 'done', label: 'Done', items: done, color: '#2CB67D', bg: 'rgba(44,182,125,0.1)' },
    { key: 'skipped', label: 'Skipped', items: skipped, color: '#A7A9BE', bg: 'rgba(167,169,190,0.1)' },
  ];

  const isOverdue = (dateStr) => dateStr && new Date(dateStr) < new Date();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px' }}>Chore Board</h1>
        <button onClick={() => setShowForm(true)} className="gradient-btn" style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Add Chore
        </button>
      </div>

      {awaitingApproval.length > 0 && (
        <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px' }}>Awaiting Approval ({awaitingApproval.length})</h2>
            <span style={{ fontSize: '12px', color: '#A7A9BE' }}>Admin action required</span>
          </div>

          {awaitingApproval.map((chore) => {
            const approveKey = `approve-${chore._id}`;
            const rejectKey = `reject-${chore._id}`;

            return (
              <div key={chore._id} style={{ padding: '16px', borderRadius: '14px', background: '#252436', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{chore.title}</p>
                  <p style={{ fontSize: '13px', color: '#A7A9BE' }}>
                    {chore.completionRequestedBy?.name || 'A member'} requested completion
                    {chore.group_id?.name ? ` • ${chore.group_id.name}` : ''}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleApprove(chore)}
                    disabled={actionLoading[approveKey]}
                    className="gradient-btn"
                    style={{ padding: '9px 14px', borderRadius: '10px', fontSize: '13px', opacity: actionLoading[approveKey] ? 0.7 : 1 }}
                  >
                    {actionLoading[approveKey] ? 'Approving...' : 'Approve ✅'}
                  </button>
                  <button
                    onClick={() => handleReject(chore)}
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

      {chores.length === 0 ? (
        <div className="glass" style={{ padding: '60px', textAlign: 'center', color: '#A7A9BE' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <p style={{ fontSize: '16px', fontWeight: 500 }}>No chores yet</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Add chores for your group members</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {columnConfig.map((column) => (
            <div key={column.key}>
              <div className="glass" style={{ padding: '16px', marginBottom: '16px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '15px' }}>{column.label}</h2>
                  <span style={{ background: column.bg, color: column.color, fontWeight: 700, fontSize: '12px', padding: '2px 10px', borderRadius: '20px' }}>
                    {column.items.length}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {column.items.map((chore) => {
                  const deleteKey = `delete-${chore._id}`;
                  const requestKey = `request-${chore._id}`;
                  const undoKey = `undo-${chore._id}`;
                  const adminForChore = isAdminOfGroup(chore.group_id);

                  return (
                    <div key={chore._id} className="glass card-hover" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{chore.title}</h3>
                          {chore.group_id?.name && (
                            <p style={{ fontSize: '12px', color: '#A7A9BE' }}>{chore.group_id.name}</p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDelete(chore._id)}
                          disabled={actionLoading[deleteKey]}
                          style={{ background: 'transparent', border: 'none', cursor: actionLoading[deleteKey] ? 'not-allowed' : 'pointer', color: '#A7A9BE', padding: '2px', transition: 'color 0.2s', opacity: actionLoading[deleteKey] ? 0.6 : 1 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                          {chore.assigned_to?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span style={{ fontSize: '13px', color: '#A7A9BE' }}>{chore.assigned_to?.name || 'Unassigned'}</span>
                      </div>

                      {chore.due_date && (
                        <p style={{ fontSize: '12px', color: isOverdue(chore.due_date) ? '#FF6584' : '#A7A9BE', marginBottom: '8px' }}>
                          Due {new Date(chore.due_date).toLocaleDateString()}
                          {isOverdue(chore.due_date) && ' (overdue)'}
                        </p>
                      )}

                      {chore.recurrence && chore.recurrence !== 'none' && (
                        <span style={{ fontSize: '11px', background: '#252436', color: '#A7A9BE', padding: '2px 8px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px' }}>
                          {chore.recurrence}
                        </span>
                      )}

                      {chore.completionRequested && (
                        <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', background: 'rgba(255,137,6,0.18)', color: '#FFB566', padding: '4px 10px', borderRadius: '999px', display: 'inline-block', fontWeight: 700 }}>
                            Pending Approval ⏳
                          </span>
                          {chore.completionRequestedBy?.name && (
                            <p style={{ fontSize: '12px', color: '#A7A9BE', marginTop: '8px' }}>
                              Requested by {chore.completionRequestedBy.name}
                            </p>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {column.key === 'pending' && !chore.completionRequested && (
                          <button
                            onClick={() => handleRequestCompletion(chore)}
                            disabled={actionLoading[requestKey]}
                            className="gradient-btn"
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', textAlign: 'center', opacity: actionLoading[requestKey] ? 0.7 : 1 }}
                          >
                            {actionLoading[requestKey]
                              ? (adminForChore ? 'Saving...' : 'Requesting...')
                              : (adminForChore ? 'Mark Done' : 'Request Completion')}
                          </button>
                        )}

                        {column.key === 'done' && (
                          <button
                            onClick={() => handleUndo(chore)}
                            disabled={actionLoading[undoKey]}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A7A9BE', cursor: actionLoading[undoKey] ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: actionLoading[undoKey] ? 0.7 : 1 }}
                          >
                            {actionLoading[undoKey] ? 'Undoing...' : 'Undo'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {column.items.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#A7A9BE', fontSize: '13px' }}>
                    No {column.label.toLowerCase()} chores
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Chore" hideFooter>
        <ChoreForm groups={groups} onSubmit={handleAdd} onCancel={() => setShowForm(false)} submitting={formSubmitting} />
      </Modal>
    </div>
  );
}
