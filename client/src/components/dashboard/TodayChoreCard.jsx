import { isToday } from '../../utils/dateFormatter.js';

export default function TodayChoreCard({ chores }) {
  const todayChores = chores?.filter((c) => isToday(c.due_date) && c.status === 'pending') || [];

  return (
    <div className="p-4 rounded-xl border bg-white">
      <h3 className="font-semibold mb-2">Today&apos;s Chores</h3>
      {todayChores.length ? (
        <ul className="space-y-1">
          {todayChores.map((c) => (
            <li key={c._id} className="text-slate-700">
              {c.title} — {c.assigned_to?.name || 'Unassigned'}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-500">No chores due today</p>
      )}
    </div>
  );
}
