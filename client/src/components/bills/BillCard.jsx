import { formatDate } from '../../utils/dateFormatter.js';

export default function BillCard({ bill, onMarkPaid, onDelete }) {
  return (
    <div className={`p-4 rounded-xl border ${bill.paid ? 'bg-emerald-50' : 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`font-medium ${bill.paid ? 'line-through text-slate-500' : ''}`}>{bill.title}</p>
          <p className="text-slate-600">₹{bill.amount}</p>
          <p className="text-sm text-slate-500">{bill.due_date ? formatDate(bill.due_date) : 'No due date'}</p>
        </div>
        <div className="flex gap-2">
          {!bill.paid && onMarkPaid && (
            <button
              onClick={() => onMarkPaid(bill._id)}
              className="text-emerald-600 text-sm hover:underline"
            >
              Mark Paid
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(bill._id)} className="text-red-600 text-sm hover:underline">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
