import { formatShortDate } from '../../utils/dateFormatter.js';

export default function ChoreCard({ chore, onUpdate, onDelete }) {
  const isDone = chore.status === 'done';
  const isSkipped = chore.status === 'skipped';

  return (
    <div className={`p-4 rounded-xl border ${isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`font-medium ${isDone ? 'line-through text-slate-500' : ''}`}>{chore.title}</p>
          <p className="text-sm text-slate-500">
            {chore.assigned_to?.name || 'Unassigned'} · {chore.due_date ? formatShortDate(chore.due_date) : 'No date'}
          </p>
        </div>
        <div className="flex gap-1">
          {chore.status === 'pending' && (
            <>
              <button
                onClick={() => onUpdate?.(chore._id, { status: 'done' })}
                className="text-emerald-600 text-sm hover:underline"
              >
                Done
              </button>
              <button
                onClick={() => onUpdate?.(chore._id, { status: 'skipped' })}
                className="text-amber-600 text-sm hover:underline"
              >
                Skip
              </button>
            </>
          )}
          {onDelete && (
            <button onClick={() => onDelete?.(chore._id)} className="text-red-600 text-sm hover:underline">
              Del
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
