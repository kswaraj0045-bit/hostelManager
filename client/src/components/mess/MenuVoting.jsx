import { useState } from 'react';
import { DAYS } from '../../constants/index.js';

export default function MenuVoting({ onSubmit }) {
  const [days, setDays] = useState(
    DAYS.slice(1, 6).map((day) => ({ day, meal: '' }))
  );

  const updateMeal = (index, meal) => {
    setDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], meal };
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ days });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', color: '#FFFFFE' }}>
      {days.map((item, index) => (
        <div key={item.day}>
          <label className="form-label">{item.day}</label>
          <input
            type="text"
            value={item.meal}
            onChange={(e) => updateMeal(index, e.target.value)}
            className="input-dark"
            placeholder="e.g. Dal Rice, Roti Sabzi"
          />
        </div>
      ))}

      <button type="submit" className="gradient-btn" style={{ alignSelf: 'flex-end', padding: '11px 20px', borderRadius: '12px', fontSize: '14px' }}>
        Save Menu
      </button>
    </form>
  );
}
