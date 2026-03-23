import BalanceCard from '../expenses/BalanceCard.jsx';

export default function BalanceSummaryCard({ netBalance }) {
  const type = netBalance > 0 ? 'positive' : netBalance < 0 ? 'negative' : 'neutral';
  const label = netBalance > 0 ? 'You are owed' : netBalance < 0 ? 'You owe' : 'All settled';

  return (
    <BalanceCard label={label} amount={netBalance} type={type} />
  );
}
