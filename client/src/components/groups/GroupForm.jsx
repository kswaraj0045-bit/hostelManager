import { useState } from 'react';
import { GROUP_TYPES } from '../../constants/index.js';

export default function GroupForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('hostel');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), type });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', color: '#FFFFFE' }}>
      <div>
        <label className="form-label">Group Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-dark"
          placeholder="e.g. Room 101"
          required
        />
      </div>

      <div>
        <label className="form-label">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input-dark"
        >
          {GROUP_TYPES.map((item) => (
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
          Create
        </button>
      </div>
    </form>
  );
}
