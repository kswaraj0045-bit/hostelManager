import { Link } from 'react-router-dom';

export default function GroupCard({ group, balance }) {
  return (
    <Link
      to={`/groups/${group._id}`}
      className="block p-4 rounded-xl border bg-white hover:shadow-lg transition-shadow"
    >
      <h3 className="font-semibold text-lg">{group.name}</h3>
      <p className="text-sm text-slate-500 capitalize">{group.type}</p>
      <div className="flex -space-x-2 mt-2">
        {group.members?.slice(0, 4).map((m) => (
          <div
            key={m.user._id}
            className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs border-2 border-white"
            title={m.user.name}
          >
            {m.user.name?.[0] || '?'}
          </div>
        ))}
      </div>
      {balance !== undefined && (
        <p className={`mt-2 text-sm font-medium ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          Net: ₹{Math.abs(balance).toFixed(2)} {balance >= 0 ? 'owed to you' : 'you owe'}
        </p>
      )}
    </Link>
  );
}
