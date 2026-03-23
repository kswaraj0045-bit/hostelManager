import BillCard from './BillCard.jsx';

export default function BillList({ bills, onMarkPaid, onDelete }) {
  return (
    <div className="space-y-2">
      {bills?.map((b) => (
        <BillCard key={b._id} bill={b} onMarkPaid={onMarkPaid} onDelete={onDelete} />
      ))}
    </div>
  );
}
