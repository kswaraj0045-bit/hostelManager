import { useEffect, useState } from 'react';

export default function BillForm({ group, onSubmit, onCancel, submitting = false }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    const firstMemberId = group?.members?.[0]?.user?._id || '';
    setAssignedTo(firstMemberId);
  }, [group]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit({
        group_id: group._id,
        title: title.trim(),
        amount: parseFloat(amount),
        due_date: dueDate || undefined,
        assigned_to: assignedTo,
        split_among: group.members?.map((m) => m.user._id) || []
      });
    } catch {
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', color: '#FFFFFE' }}>
      <div>
        <label className="form-label">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-dark"
          placeholder="e.g. Electricity bill"
          required
        />
      </div>

      <div>
        <label className="form-label">Amount (Rs)</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input-dark"
          placeholder="0.00"
          required
        />
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
        <label className="form-label">Who will pay this bill?</label>
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="input-dark"
          required
        >
          {(group.members || []).map((member) => (
            <option key={member.user._id} value={member.user._id}>
              {member.user.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} className="secondary-btn-dark" disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="gradient-btn" disabled={submitting} style={{ padding: '11px 20px', borderRadius: '12px', fontSize: '14px', opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Adding...' : 'Add Bill'}
        </button>
      </div>
    </form>
  );
}
