import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Receipt, Search } from 'lucide-react';
import api from '../services/api.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../context/AuthContext.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'expense', label: 'Expenses' },
  { key: 'settlement', label: 'Settlements' },
  { key: 'paid', label: 'I Paid' },
  { key: 'received', label: 'I Received' }
];

const getId = (ref) => {
  if (!ref) return null;
  return ref._id ? ref._id.toString() : ref.toString();
};

const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getYourShare = (expense, userId) => {
  const split = (expense.splits || []).find((item) => getId(item.user) === userId);
  return split ? Number(split.amount || 0) : 0;
};

const getSharedWith = (expense, userId) => {
  const names = (expense.splits || [])
    .map((split) => split.user?.name)
    .filter(Boolean)
    .filter((name, index, arr) => arr.indexOf(name) === index);

  const withoutCurrentUser = (expense.splits || [])
    .filter((split) => getId(split.user) !== userId)
    .map((split) => split.user?.name)
    .filter(Boolean)
    .filter((name, index, arr) => arr.indexOf(name) === index);

  const targetNames = withoutCurrentUser.length > 0 ? withoutCurrentUser : names;
  return targetNames.length > 0 ? targetNames.join(', ') : 'Just you';
};

const getSearchText = (item) => {
  const names = [];

  if (item.type === 'expense') {
    if (item.paid_by?.name) names.push(item.paid_by.name);
    (item.splits || []).forEach((split) => {
      if (split.user?.name) names.push(split.user.name);
    });
    return [
      item.description,
      item.group_id?.name,
      ...names
    ].join(' ').toLowerCase();
  }

  if (item.paid_by?.name) names.push(item.paid_by.name);
  if (item.paid_to?.name) names.push(item.paid_to.name);

  return [
    item.note,
    item.group_id?.name,
    ...names
  ].join(' ').toLowerCase();
};

function SkeletonCard({ delay = 0 }) {
  return (
    <div
      className="glass"
      style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        animation: `pulse 1.4s ease-in-out ${delay}s infinite`
      }}
    >
      <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ width: '50%', height: '14px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ width: '75%', height: '12px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ width: '32%', height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div style={{ width: '90px', height: '18px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { error } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const currentUserId = user?._id?.toString?.() || user?._id;

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/history');
        setItems(res.data?.data || []);
      } catch (err) {
        error(err.response?.data?.message || 'Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      if (activeFilter === 'expense' && item.type !== 'expense') return false;
      if (activeFilter === 'settlement' && item.type !== 'settlement') return false;
      if (activeFilter === 'paid' && item.direction !== 'paid') return false;
      if (activeFilter === 'received' && item.direction !== 'received') return false;
      if (!query) return true;

      return getSearchText(item).includes(query);
    });
  }, [activeFilter, items, search]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px', marginBottom: '6px' }}>
          Payment History
        </h1>
        <p style={{ color: '#A7A9BE', fontSize: '14px' }}>
          Every expense and settlement you were part of, sorted newest first.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={active ? 'gradient-bg' : ''}
                style={{
                  padding: '10px 16px',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  color: active ? '#FFFFFE' : '#A7A9BE',
                  background: active ? undefined : '#252436',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="glass" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={16} color="#A7A9BE" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by person, group, description, or note"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFE',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[0, 1, 2, 3, 4].map((index) => (
            <SkeletonCard key={index} delay={index * 0.08} />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass" style={{ padding: '56px', textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '12px' }}>📋</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '20px', marginBottom: '8px' }}>
            No payment history yet
          </h2>
          <p style={{ color: '#A7A9BE', fontSize: '14px' }}>
            Expenses and settlements will appear here once you start using shared payments.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredItems.map((item) => {
            const timestamp = item.createdAt || item.date;
            const groupName = item.group_id?.name || 'Unknown Group';

            if (item.type === 'expense') {
              const payerName = item.paid_by?.name || 'Unknown';
              const yourShare = getYourShare(item, currentUserId);
              const sharedWith = getSharedWith(item, currentUserId);
              const amountColor = item.direction === 'paid' ? '#2CB67D' : '#FF6584';

              return (
                <div key={`${item.type}-${item._id}`} className="glass card-hover" style={{ padding: '20px', display: 'flex', gap: '16px' }}>
                  <div
                    className="gradient-bg"
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Receipt size={22} color="#FFFFFF" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 700, fontSize: '16px', color: '#FFFFFE' }}>{item.description}</p>
                      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '22px', color: amountColor }}>
                        {formatCurrency(item.amount)}
                      </p>
                    </div>

                    <p style={{ fontSize: '13px', color: '#FFFFFE', marginBottom: '4px' }}>
                      {item.direction === 'paid' ? `You paid • ${groupName}` : `Your share • ${groupName}`}
                    </p>
                    <p style={{ fontSize: '13px', color: '#A7A9BE', marginBottom: '10px' }}>
                      {item.direction === 'paid'
                        ? `Split among ${sharedWith}`
                        : `Paid by ${payerName} • Your share: ${formatCurrency(yourShare)}`}
                    </p>
                    <p style={{ fontSize: '12px', color: '#A7A9BE' }}>{formatDateTime(timestamp)}</p>
                  </div>
                </div>
              );
            }

            const otherPerson = item.direction === 'paid' ? item.paid_to : item.paid_by;
            const amountColor = item.direction === 'paid' ? '#FF6584' : '#2CB67D';
            const iconBackground = item.direction === 'paid'
              ? 'rgba(255,101,132,0.14)'
              : 'rgba(44,182,125,0.14)';
            const iconBorder = item.direction === 'paid'
              ? 'rgba(255,101,132,0.2)'
              : 'rgba(44,182,125,0.2)';

            return (
              <div key={`${item.type}-${item._id}`} className="glass card-hover" style={{ padding: '20px', display: 'flex', gap: '16px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: iconBackground,
                    border: `1px solid ${iconBorder}`,
                    flexShrink: 0
                  }}
                >
                  <ArrowLeftRight size={22} color={amountColor} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 700, fontSize: '16px', color: '#FFFFFE' }}>Settlement</p>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '22px', color: amountColor }}>
                      {formatCurrency(item.amount)}
                    </p>
                  </div>

                  <p style={{ fontSize: '13px', color: '#FFFFFE', marginBottom: item.note ? '4px' : '10px' }}>
                    {item.direction === 'paid'
                      ? `You paid ${otherPerson?.name || 'Unknown'} • ${groupName}`
                      : `${otherPerson?.name || 'Unknown'} paid you • ${groupName}`}
                  </p>

                  {item.note ? (
                    <p style={{ fontSize: '13px', color: '#A7A9BE', fontStyle: 'italic', marginBottom: '10px' }}>
                      {item.note}
                    </p>
                  ) : null}

                  <p style={{ fontSize: '12px', color: '#A7A9BE' }}>{formatDateTime(timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.55; }
          50% { opacity: 1; }
          100% { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
