import { formatShortDate } from '../../utils/dateFormatter.js';
import { CATEGORIES } from '../../constants/index.js';

export default function ExpenseList({ expenses, onDelete }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {expenses?.map((expense) => (
        <div
          key={expense._id}
          className="glass"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#252436', gap: '12px' }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, color: '#FFFFFE', marginBottom: '4px' }}>{expense.description}</p>
            <p style={{ fontSize: '13px', color: '#A7A9BE' }}>
              Rs {expense.amount} · {expense.paid_by?.name} · {CATEGORIES.find((item) => item === expense.category) || expense.category} · {formatShortDate(expense.date)}
            </p>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(expense._id)}
              style={{ background: 'transparent', border: 'none', color: '#FF6584', cursor: 'pointer', fontSize: '13px', fontWeight: 600, flexShrink: 0 }}
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
