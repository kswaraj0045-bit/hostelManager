export default function BalanceCard({ label, amount, type = 'neutral' }) {
  const colors = {
    positive: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    negative: 'bg-red-100 text-red-800 border-red-300',
    neutral: 'bg-slate-100 text-slate-800 border-slate-300'
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${colors[type]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold">₹{Math.abs(amount || 0).toFixed(2)}</p>
    </div>
  );
}
