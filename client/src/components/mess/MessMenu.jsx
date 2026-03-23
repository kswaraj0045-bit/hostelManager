import { DAYS } from '../../constants/index.js';

export default function MessMenu({ menu, onVote }) {
  const days = menu?.days || [];

  return (
    <div className="space-y-4">
      {days.map((d, i) => (
        <div key={i} className="p-4 rounded-xl border bg-white">
          <p className="font-medium">{d.day}</p>
          <p className="text-slate-600">{d.meal || 'Not set'}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-slate-500">{d.votes?.length || 0} votes</span>
            {onVote && (
              <button
                onClick={() => onVote(i)}
                className="text-sm text-emerald-600 hover:underline"
              >
                Vote
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
