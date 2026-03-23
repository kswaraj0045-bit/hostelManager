import { useState, useEffect } from 'react';
import { Receipt, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../../constants/index.js';
import { splitEqually, validateSplits } from '../../utils/splitCalculator.js';
import { useToast } from '../../hooks/useToast.js';

const CATEGORY_OPTIONS = [
  { value: 'food', emoji: '🍕', label: 'Food' },
  { value: 'travel', emoji: '🚗', label: 'Travel' },
  { value: 'utilities', emoji: '⚡', label: 'Utilities' },
  { value: 'shopping', emoji: '🛒', label: 'Shopping' },
  { value: 'misc', emoji: '📦', label: 'Misc' },
  { value: 'other', emoji: '🎉', label: 'Other' },
];

const STEPS = ['Details', 'Split', 'Review'];

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
      {STEPS.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'upcoming';
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
              background: state === 'active' ? 'linear-gradient(135deg, #6C63FF, #FF6584)' : state === 'done' ? 'rgba(44,182,125,0.2)' : '#252436',
              color: state === 'active' ? 'white' : state === 'done' ? '#2CB67D' : '#A7A9BE',
              transition: 'all 0.3s'
            }}>
              {state === 'done' ? '✓' : i + 1} {step}
            </div>
            {i < STEPS.length - 1 && <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />}
          </div>
        );
      })}
    </div>
  );
}

export default function ExpenseForm({ group, onSubmit, onCancel }) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('misc');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [splitType, setSplitType] = useState('equal');
  const [customSplits, setCustomSplits] = useState({});

  useEffect(() => {
    if (group?.members?.length) {
      setPaidBy(group.members[0].user._id);
      setSelectedMembers(group.members.map(m => m.user._id));
    }
  }, [group]);

  const totalAmount = parseFloat(amount) || 0;
  const memberCount = selectedMembers.length;
  const equalShare = memberCount > 0 ? (totalAmount / memberCount) : 0;

  const getCustomSplit = (uid) => parseFloat(customSplits[uid] || 0);
  const totalCustom = selectedMembers.reduce((s, uid) => s + getCustomSplit(uid), 0);
  const customValid = Math.abs(totalCustom - totalAmount) < 0.01;

  const toggleMember = (uid) => {
    setSelectedMembers(prev =>
      prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]
    );
  };

  const buildSplits = () => {
    if (splitType === 'equal') {
      return selectedMembers.map(uid => ({ user: uid, amount: equalShare }));
    }
    return selectedMembers.map(uid => ({ user: uid, amount: getCustomSplit(uid) }));
  };

  const isStep1Valid = description.trim() && totalAmount > 0 && paidBy;
  const isStep2Valid = selectedMembers.length > 0 && (splitType === 'equal' || customValid);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({
        group_id: group._id,
        description: description.trim(),
        amount: totalAmount,
        category,
        paid_by: paidBy,
        splits: buildSplits(),
        date: new Date(date).toISOString()
      });
      success('Expense added');
      onCancel?.();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ color: '#FFFFFE' }}>
      <StepIndicator current={step} />

      {/* STEP 1 — Details */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Amount */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '28px', color: '#6C63FF', fontWeight: 700 }}>₹</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="input-dark"
                style={{ paddingLeft: '44px', fontSize: '32px', fontWeight: 700, textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif" }}
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ position: 'relative' }}>
            <Receipt size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A7A9BE', pointerEvents: 'none' }} />
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-dark"
              style={{ paddingLeft: '44px' }}
              placeholder="What was this for?"
            />
          </div>

          {/* Category */}
          <div>
            <p style={{ fontSize: '13px', color: '#A7A9BE', marginBottom: '10px' }}>Category</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {CATEGORY_OPTIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  style={{
                    padding: '10px 8px', borderRadius: '12px', border: '1px solid',
                    borderColor: category === c.value ? '#6C63FF' : 'rgba(255,255,255,0.1)',
                    background: category === c.value ? 'linear-gradient(135deg, #6C63FF, #FF6584)' : '#252436',
                    color: category === c.value ? 'white' : '#A7A9BE',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paid by */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#A7A9BE', marginBottom: '8px' }}>Paid by</label>
            <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="input-dark">
              {group?.members?.map(m => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#A7A9BE', marginBottom: '8px' }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-dark" style={{ colorScheme: 'dark' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onCancel} style={{ padding: '11px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A7A9BE', cursor: 'pointer', fontSize: '14px' }}>
              Cancel
            </button>
            <button type="button" onClick={() => setStep(1)} disabled={!isStep1Valid} className="gradient-btn" style={{ padding: '11px 24px', borderRadius: '12px', fontSize: '14px' }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Split */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Who's involved?</p>
            <p style={{ fontSize: '13px', color: '#A7A9BE', marginBottom: '14px' }}>Select members to split with</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group?.members?.map(m => {
                const uid = m.user._id;
                const sel = selectedMembers.includes(uid);
                return (
                  <div
                    key={uid}
                    onClick={() => toggleMember(uid)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', border: '1px solid', borderColor: sel ? '#6C63FF' : 'rgba(255,255,255,0.1)', background: sel ? 'rgba(108,99,255,0.1)' : '#252436', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="gradient-bg" style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700 }}>
                        {m.user.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: '14px' }}>{m.user.name}</span>
                    </div>
                    {sel && <span style={{ color: '#6C63FF', fontSize: '16px' }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Split type */}
          <div>
            <p style={{ fontSize: '13px', color: '#A7A9BE', marginBottom: '10px' }}>Split type</p>
            <div style={{ display: 'flex', background: '#252436', borderRadius: '12px', padding: '4px' }}>
              {['equal', 'custom'].map(t => (
                <button key={t} type="button" onClick={() => setSplitType(t)} style={{ flex: 1, padding: '9px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s', background: splitType === t ? 'linear-gradient(135deg, #6C63FF, #FF6584)' : 'transparent', color: splitType === t ? 'white' : '#A7A9BE' }}>
                  {t === 'equal' ? 'Equal Split' : 'Custom Amounts'}
                </button>
              ))}
            </div>
          </div>

          {/* Equal preview */}
          {splitType === 'equal' && selectedMembers.length > 0 && (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <p className="gradient-text" style={{ fontSize: '22px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Each pays ₹{equalShare.toFixed(2)}</p>
              <p style={{ fontSize: '13px', color: '#A7A9BE', marginTop: '4px' }}>Split equally among {memberCount} members</p>
            </div>
          )}

          {/* Custom inputs */}
          {splitType === 'custom' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {selectedMembers.map(uid => {
                  const member = group?.members?.find(m => m.user._id === uid);
                  return (
                    <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ flex: 1, fontSize: '14px' }}>{member?.user.name}</span>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6C63FF', fontWeight: 700 }}>₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={customSplits[uid] || ''}
                          onChange={e => setCustomSplits(prev => ({ ...prev, [uid]: e.target.value }))}
                          className="input-dark"
                          style={{ width: '120px', paddingLeft: '30px', fontSize: '14px' }}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Progress bar */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ height: '6px', background: '#252436', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((totalCustom / totalAmount) * 100, 100)}%`, background: customValid ? '#2CB67D' : 'linear-gradient(90deg, #6C63FF, #FF6584)', borderRadius: '6px', transition: 'width 0.3s' }} />
                </div>
              </div>
              <p style={{ fontSize: '13px', color: customValid ? '#2CB67D' : '#FF6584', textAlign: 'center' }}>
                {customValid ? `✅ ₹${totalCustom.toFixed(2)} allocated perfectly` : `₹${totalCustom.toFixed(2)} of ₹${totalAmount.toFixed(2)} — ₹${Math.abs(totalAmount - totalCustom).toFixed(2)} remaining`}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button type="button" onClick={() => setStep(0)} style={{ padding: '11px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A7A9BE', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
            <button type="button" onClick={() => setStep(2)} disabled={!isStep2Valid} className="gradient-btn" style={{ padding: '11px 24px', borderRadius: '12px', fontSize: '14px' }}>Next →</button>
          </div>
        </div>
      )}

      {/* STEP 3 — Review */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '12px' }}>
              Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                ['Description', description],
                ['Amount', `₹${totalAmount.toFixed(2)}`],
                ['Category', CATEGORY_OPTIONS.find(c => c.value === category)?.label || category],
                ['Paid By', group?.members?.find(m => m.user._id === paidBy)?.user.name],
                ['Date', new Date(date).toLocaleDateString()],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#A7A9BE' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '13px', color: '#A7A9BE', marginBottom: '10px' }}>Split among</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {buildSplits().map(s => {
                const member = group?.members?.find(m => m.user._id === s.user);
                return (
                  <div key={s.user} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: '#252436', fontSize: '14px' }}>
                    <span>{member?.user.name}</span>
                    <span style={{ fontWeight: 700, color: '#6C63FF' }}>₹{s.amount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button type="button" onClick={() => setStep(1)} style={{ padding: '11px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A7A9BE', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
            <button type="button" onClick={handleSubmit} disabled={loading} className="gradient-btn" style={{ flex: 1, padding: '13px', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Adding...</> : '✓ Confirm & Add'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
