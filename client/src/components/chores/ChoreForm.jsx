import { useState } from 'react';
import { CHORE_RECURRENCE } from '../../constants/index.js';

export default function ChoreForm({ groups, onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState(groups?.[0]?._id || '');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState('weekly');

  const group = groups?.find((item) => item._id === groupId);
  const members = group?.members || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      group_id: groupId,
      title: title.trim(),
      assigned_to: assignedTo || undefined,
      due_date: dueDate || undefined,
      recurrence
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', color: '#FFFFFE' }}>
      <div>
        <label className="form-label">Group</label>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="input-dark"
        >
          {groups?.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-dark"
          placeholder="e.g. Clean bathroom"
          required
        />
      </div>

      <div>
        <label className="form-label">Assigned to</label>
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="input-dark"
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.user._id} value={member.user._id}>
              {member.user.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="input-dark"
        />
      </div>

      <div>
        <label className="form-label">Recurrence</label>
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
          className="input-dark"
        >
          {CHORE_RECURRENCE.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} className="secondary-btn-dark">
            Cancel
          </button>
        )}
        <button type="submit" className="gradient-btn" style={{ padding: '11px 20px', borderRadius: '12px', fontSize: '14px' }}>
          Add Chore
        </button>
      </div>
    </form>
  );
}
