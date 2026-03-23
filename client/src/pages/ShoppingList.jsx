import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, Plus, Trash2, ChevronDown, ChevronUp, Bot, Sparkles, X } from 'lucide-react'
import * as shoppingService from '../services/shoppingService'
import * as groupService from '../services/groupService'
import { useToast } from '../hooks/useToast'

const CATEGORY_EMOJI = {
  vegetable: '🥬',
  grocery: '🛒',
  fruit: '🍎',
  dairy: '🥛',
  snack: '🍿',
  other: '📦'
}

const CATEGORIES = ['grocery', 'vegetable', 'fruit', 'dairy', 'snack', 'other']

function ItemCard({ item, onCheck, onDelete }) {
  return (
    <div
      className="glass card-hover"
      style={{
        padding: '14px 16px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: item.isChecked ? 0.5 : 1,
        transition: 'opacity 0.3s'
      }}
    >
      <button
        onClick={() => onCheck(item._id)}
        style={{
          width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, cursor: 'pointer', border: 'none',
          background: item.isChecked ? 'linear-gradient(135deg,#6C63FF,#FF6584)' : 'transparent',
          border: item.isChecked ? 'none' : '2px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {item.isChecked && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#FFFFFE', fontSize: '14px', fontWeight: 500, textDecoration: item.isChecked ? 'line-through' : 'none' }}>
          {item.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
          <span style={{ background: 'rgba(108,99,255,0.15)', color: '#6C63FF', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px' }}>
            {item.quantity}
          </span>
          {item.addedBy && (
            <span style={{ color: '#A7A9BE', fontSize: '11px' }}>by {item.addedBy.name}</span>
          )}
          {item.isChecked && item.checkedBy && (
            <span style={{ color: '#A7A9BE', fontSize: '11px' }}>✓ {item.checkedBy.name}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(item._id)}
        style={{ background: 'none', border: 'none', color: '#FF6584', cursor: 'pointer', padding: '4px', opacity: 0.6, transition: 'opacity 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

export default function ShoppingList({ groupIdProp }) {
  const { success, error } = useToast()
  const [items, setItems] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(groupIdProp || '')
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ name: '', quantity: '1', category: 'other' })
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showChecked, setShowChecked] = useState(false)

  const loadItems = useCallback(async () => {
    if (!selectedGroup) return
    try {
      const res = await shoppingService.getShoppingList(selectedGroup)
      setItems(res.data?.data || [])
    } catch { setItems([]) }
  }, [selectedGroup])

  useEffect(() => {
    if (!groupIdProp) {
      groupService.getGroups()
        .then(res => {
          const gs = res.data?.data || []
          setGroups(gs)
          if (gs.length > 0 && !selectedGroup) setSelectedGroup(gs[0]._id)
        })
        .catch(console.error)
    }
  }, [groupIdProp])

  useEffect(() => { loadItems() }, [loadItems])

  const handleCheck = async (itemId) => {
    try {
      const res = await shoppingService.checkItem(itemId)
      setItems(prev => prev.map(i => i._id === itemId ? res.data.data : i))
    } catch (err) {
      error('Failed to update item')
    }
  }

  const handleDelete = async (itemId) => {
    try {
      await shoppingService.deleteItem(itemId)
      setItems(prev => prev.filter(i => i._id !== itemId))
      success('Item removed')
    } catch (err) {
      error('Failed to delete item')
    }
  }

  const handleClearChecked = async () => {
    const checkedItems = items.filter(i => i.isChecked)
    for (const item of checkedItems) {
      try { await shoppingService.deleteItem(item._id) } catch {}
    }
    setItems(prev => prev.filter(i => !i.isChecked))
    success('Cleared checked items')
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!form.name || !selectedGroup) return
    setLoading(true)
    try {
      const res = await shoppingService.addItem(selectedGroup, form)
      setItems(prev => [res.data.data, ...prev])
      success('Item added!')
      setShowAddModal(false)
      setForm({ name: '', quantity: '1', category: 'other' })
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add item')
    } finally {
      setLoading(false)
    }
  }

  const handleAISuggest = async () => {
    if (!selectedGroup) return
    setAiLoading(true)
    setSuggestions([])
    try {
      const res = await shoppingService.getAISuggestions(selectedGroup)
      setSuggestions(res.data?.data || [])
    } catch (err) {
      error('AI suggestions failed')
    } finally {
      setAiLoading(false)
    }
  }

  const addSuggestion = async (item) => {
    if (!selectedGroup) return
    try {
      const res = await shoppingService.addItem(selectedGroup, item)
      setItems(prev => [res.data.data, ...prev])
      setSuggestions(prev => prev.filter(s => s.name !== item.name))
      success(`${item.name} added!`)
    } catch (err) {
      error('Failed to add item')
    }
  }

  const unchecked = items.filter(i => !i.isChecked)
  const checked = items.filter(i => i.isChecked)

  // Group unchecked by category
  const grouped = {}
  unchecked.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  })

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '28px', color: '#FFFFFE' }}>🛒 Shopping List</h1>
          <p style={{ color: '#A7A9BE', fontSize: '14px', marginTop: '4px' }}>Shared group shopping</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!groupIdProp && (
            <select
              className="input-dark"
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              style={{ width: 'auto', minWidth: '160px', padding: '8px 12px' }}
            >
              <option value="">Select group</option>
              {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
            </select>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="gradient-btn"
            style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {!selectedGroup ? (
        <div className="glass" style={{ padding: '60px', textAlign: 'center', color: '#A7A9BE' }}>
          <p style={{ fontSize: '36px', marginBottom: '12px' }}>🛒</p>
          <p>Select a group to see the shopping list</p>
        </div>
      ) : (
        <>
          {/* AI Suggestions */}
          <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg,rgba(108,99,255,0.06),rgba(255,101,132,0.06))', border: '1px solid rgba(108,99,255,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="gradient-bg" style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={16} color="white" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '15px', color: '#FFFFFE' }}>✨ AI Suggestions</h3>
                  <p style={{ color: '#A7A9BE', fontSize: '12px' }}>Based on your mess menu</p>
                </div>
              </div>
              <button
                onClick={handleAISuggest}
                disabled={aiLoading}
                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(108,99,255,0.4)', background: 'transparent', color: '#6C63FF', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={14} /> {aiLoading ? 'Thinking...' : 'Suggest items'}
              </button>
            </div>
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                {suggestions.map((item, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '6px 12px', fontSize: '13px', color: '#FFFFFE' }}
                  >
                    {CATEGORY_EMOJI[item.category] || '📦'} {item.name} <span style={{ color: '#A7A9BE' }}>({item.quantity})</span>
                    <button
                      onClick={() => addSuggestion(item)}
                      className="gradient-btn"
                      style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, marginLeft: '4px' }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unchecked Items */}
          {Object.keys(grouped).length === 0 && checked.length === 0 ? (
            <div className="glass" style={{ padding: '60px', textAlign: 'center', color: '#A7A9BE' }}>
              <p style={{ fontSize: '36px', marginBottom: '12px' }}>🛍️</p>
              <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>List is empty</p>
              <p>Add items your group needs</p>
            </div>
          ) : (
            Object.keys(grouped).map(cat => (
              <div key={cat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '18px' }}>{CATEGORY_EMOJI[cat]}</span>
                  <h3 style={{ fontWeight: 700, fontSize: '14px', color: '#A7A9BE', textTransform: 'capitalize' }}>{cat}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {grouped[cat].map(item => (
                    <ItemCard key={item._id} item={item} onCheck={handleCheck} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Checked Items (collapsible) */}
          {checked.length > 0 && (
            <div>
              <button
                onClick={() => setShowChecked(!showChecked)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#A7A9BE', cursor: 'pointer', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}
              >
                {showChecked ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Checked Items ({checked.length})
              </button>
              {showChecked && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {checked.map(item => (
                    <ItemCard key={item._id} item={item} onCheck={handleCheck} onDelete={handleDelete} />
                  ))}
                  <button
                    onClick={handleClearChecked}
                    style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255,101,132,0.4)', background: 'rgba(255,101,132,0.1)', color: '#FF6584', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    Clear all checked
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ background: '#1C1B29', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '380px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '20px' }}>Add Item</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#A7A9BE', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Item Name *</label>
                <input className="input-dark" placeholder="e.g. Tomatoes" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Quantity</label>
                <input className="input-dark" placeholder="e.g. 1kg, 2 packs" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select className="input-dark" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="gradient-btn" style={{ padding: '12px', borderRadius: '12px', fontSize: '15px', fontWeight: 600 }}>
                {loading ? 'Adding...' : 'Add to List'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
