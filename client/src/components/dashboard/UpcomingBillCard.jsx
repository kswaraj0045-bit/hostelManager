import { formatDate } from '../../utils/dateFormatter.js';

export default function UpcomingBillCard({ bills }) {
  const unpaid = bills?.filter((b) => !b.paid) || [];
  const sorted = [...unpaid].sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));
  const next = sorted[0];

  return (
    <div className="p-4 rounded-xl border bg-white">
      <h3 className="font-semibold mb-2">Upcoming Bill</h3>
      {next ? (
        <div>
          <p className="font-medium">{next.title}</p>
          <p className="text-slate-600">₹{next.amount}</p>
          <p className="text-sm text-slate-500">{next.due_date ? formatDate(next.due_date) : 'No due date'}</p>
        </div>
      ) : (
        <p className="text-slate-500">No upcoming bills</p>
      )}
    </div>
  );
}
