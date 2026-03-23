import { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import dayjs from 'dayjs'
import { Plus, X, Trash2, AlarmClock } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import * as reminderService from '../services/reminderService'
import * as choreService from '../services/choreService'
import * as billService from '../services/billService'
import * as groupService from '../services/groupService'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useToast } from '../hooks/useToast'

const localizer = momentLocalizer(moment)

const REPEAT_OPTIONS = ['none', 'daily', 'weekly', 'monthly']

export default function CalendarPage() {
  const { success, error } = useToast()
  const { permission, requestPermission } = usePushNotifications()
  const [reminders, setReminders] = useState([])
  const [chores, setChores] = useState([])
  const [bills, setBills] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [events, setEvents] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', remind_at: '', repeat: 'none', channels: { email: true, push: true } })
  const [loading, setLoading] = useState(false)
  const [pushDismissed, setPushDismissed] = useState(() => localStorage.getItem('pushDismissed') === '1')

  const loadData = useCallback(async () => {
    try {
      const [rRes, gRes] = await Promise.all([
        reminderService.getReminders(),
        groupService.getGroups()
      ])
      setReminders(rRes.data?.data || [])
      setGroups(gRes.data?.data || [])
    } catch (err) {
      console.error('Failed to load calendar data:', err.message)
    }
  }, [])

  const loadBills = useCallback(async () => {
    try {
      const groups = await groupService.getGroups()
      const groupList = groups.data?.data || []
      const allBills = []
      for (const group of groupList) {
        try {
          const res = await billService.getBills(group._id)
          const groupBills = (res.data?.data || []).map(b => ({ ...b, groupName: group.name }))
          allBills.push(...groupBills)
        } catch {}
      }
      setBills(allBills)
    } catch (err) {
      console.error('Failed to load bills:', err.message)
    }
  }, [])

  const loadChores = useCallback(async (groupId) => {
    try {
      if (groupId) {
        const res = await choreService.getChores(groupId)
        setChores(res.data?.data || [])
      } else {
        const gRes = await groupService.getGroups()
        const groupList = gRes.data?.data || []
        const allChores = []
        for (const group of groupList) {
          try {
            const res = await choreService.getChores(group._id)
            allChores.push(...(res.data?.data || []))
          } catch {}
        }
        setChores(allChores)
      }
    } catch (err) {
      console.error('Failed to load chores:', err.message)
      setChores([])
    }
  }, [])

  useEffect(() => { loadData(); loadBills(); loadChores('') }, [loadData, loadBills, loadChores])
  useEffect(() => { loadChores(selectedGroup) }, [selectedGroup, loadChores])

  useEffect(() => {
    const choreEvents = chores
      .filter(c => c.due_date)
      .map(c => ({
        id: c._id,
        title: `🧹 ${c.title}`,
        start: new Date(c.due_date),
        end: new Date(c.due_date),
        type: 'chore',
        raw: c,
        color: '#6C63FF'
      }))
    const reminderEvents = reminders
      .filter(r => !r.isCompleted)
      .map(r => ({
        id: r._id,
        title: `🔔 ${r.title}`,
        start: new Date(r.remind_at),
        end: new Date(r.remind_at),
        type: 'reminder',
        raw: r,
        color: '#FF6584'
      }))
    const billEvents = bills
      .filter(b => {
        const billGroupId = b.group_id?._id?.toString?.() || b.group_id?.toString?.() || ''
        return b.due_date && !b.paid && (!selectedGroup || billGroupId === selectedGroup)
      })
      .map(b => ({
        id: b._id,
        title: `💰 ${b.title} ₹${b.amount}`,
        start: new Date(b.due_date),
        end: new Date(b.due_date),
        type: 'bill',
        raw: b,
        color: '#FF8906'
      }))
    setEvents([...choreEvents, ...reminderEvents, ...billEvents])
  }, [chores, reminders, bills, selectedGroup])

  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const handleAddReminder = async (e) => {
    e.preventDefault()
    if (!form.title || !form.remind_at) return
    setLoading(true)
    try {
      await reminderService.createReminder(form)
      success('Reminder created!')
      setShowAddModal(false)
      setForm({ title: '', description: '', remind_at: '', repeat: 'none', channels: { email: true, push: true } })
      loadData()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create reminder')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReminder = async (id) => {
    try {
      await reminderService.deleteReminder(id)
      success('Reminder deleted')
      setShowEventModal(false)
      loadData()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete')
    }
  }

  const handleSnoozeReminder = async (id) => {
    try {
      await reminderService.snoozeReminder(id)
      success('Snoozed for 30 minutes')
      setShowEventModal(false)
      loadData()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to snooze')
    }
  }

  const eventStyleGetter = (event) => ({
    style: {
      background: event.color === '#6C63FF'
        ? 'linear-gradient(135deg, #6C63FF, #4834D4)'
        : event.color === '#FF8906'
        ? 'linear-gradient(135deg, #FF8906, #E07800)'
        : 'linear-gradient(135deg, #FF6584, #FF4465)',
      border: 'none',
      borderRadius: '6px',
      color: 'white',
      fontSize: '11px',
      padding: '2px 6px'
    }
  })

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {!pushDismissed && permission === 'default' && (
        <div className="glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)' }}>
          <span style={{ fontSize: '24px' }}>🔔</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, color: '#FFFFFE', fontSize: '14px' }}>Enable push notifications</p>
            <p style={{ color: '#A7A9BE', fontSize: '12px' }}>Get alerted when reminders are due</p>
          </div>
          <button
            onClick={requestPermission}
            className="gradient-btn"
            style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px' }}
          >
            Enable
          </button>
          <button
            onClick={() => { setPushDismissed(true); localStorage.setItem('pushDismissed', '1') }}
            style={{ background: 'none', border: 'none', color: '#A7A9BE', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '28px', color: '#FFFFFE' }}>
            Calendar
          </h1>
          <p style={{ color: '#A7A9BE', fontSize: '14px', marginTop: '4px' }}>Chores, reminders and events</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="gradient-btn"
          style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Add Reminder
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6C63FF' }} />
            <span style={{ fontSize: '13px', color: '#A7A9BE' }}>Chores</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF6584' }} />
            <span style={{ fontSize: '13px', color: '#A7A9BE' }}>Reminders</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF8906' }} />
            <span style={{ fontSize: '13px', color: '#A7A9BE' }}>Bills</span>
          </div>
        </div>
        <select
          className="input-dark"
          value={selectedGroup}
          onChange={e => setSelectedGroup(e.target.value)}
          style={{ width: 'auto', minWidth: '160px', padding: '8px 12px' }}
        >
          <option value="">No group filter</option>
          {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>
      </div>

      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleEventClick}
          eventPropGetter={eventStyleGetter}
          style={{ height: '100%' }}
        />
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ background: '#1C1B29', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '20px' }}>Add Reminder</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#A7A9BE', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddReminder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Title *</label>
                <input
                  className="input-dark"
                  placeholder="Reminder title"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="input-dark"
                  placeholder="Optional description"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>
              <div>
                <label className="form-label">Date & Time *</label>
                <input
                  className="input-dark"
                  type="datetime-local"
                  value={form.remind_at}
                  onChange={e => setForm(f => ({ ...f, remind_at: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="form-label">Repeat</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {REPEAT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, repeat: opt }))}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize',
                        background: form.repeat === opt ? 'linear-gradient(135deg, #6C63FF, #FF6584)' : 'rgba(255,255,255,0.08)',
                        color: form.repeat === opt ? 'white' : '#A7A9BE'
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Notify via</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['email', 'push'].map(ch => (
                    <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#A7A9BE', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={form.channels[ch]}
                        onChange={e => setForm(f => ({ ...f, channels: { ...f.channels, [ch]: e.target.checked } }))}
                        style={{ accentColor: '#6C63FF' }}
                      />
                      {ch.charAt(0).toUpperCase() + ch.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="gradient-btn"
                style={{ padding: '12px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, marginTop: '4px' }}
              >
                {loading ? 'Creating...' : 'Create Reminder'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEventModal && selectedEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ background: '#1C1B29', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px' }}>{selectedEvent.title}</h2>
              <button onClick={() => setShowEventModal(false)} style={{ background: 'none', border: 'none', color: '#A7A9BE', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="glass" style={{ padding: '12px 16px', borderRadius: '12px' }}>
                <p style={{ color: '#A7A9BE', fontSize: '12px', marginBottom: '4px' }}>
                  {selectedEvent.type === 'chore' ? 'Due Date' : selectedEvent.type === 'bill' ? 'Bill Due Date' : 'Remind At'}
                </p>
                <p style={{ color: '#FFFFFE', fontWeight: 600 }}>
                  {dayjs(selectedEvent.start).format('MMM D, YYYY h:mm A')}
                </p>
              </div>
              {selectedEvent.raw?.description && (
                <p style={{ color: '#A7A9BE', fontSize: '14px', lineHeight: 1.6 }}>{selectedEvent.raw.description}</p>
              )}
              {selectedEvent.type === 'chore' && selectedEvent.raw?.assigned_to && (
                <p style={{ color: '#A7A9BE', fontSize: '13px' }}>
                  Assigned to: <span style={{ color: '#6C63FF', fontWeight: 600 }}>{selectedEvent.raw.assigned_to.name || 'Unknown'}</span>
                </p>
              )}
              {selectedEvent.type === 'bill' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ color: '#A7A9BE', fontSize: '13px' }}>
                    Group: <span style={{ color: '#FFFFFE', fontWeight: 600 }}>{selectedEvent.raw.groupName || 'Unknown'}</span>
                  </p>
                  <p style={{ color: '#A7A9BE', fontSize: '13px' }}>
                    Amount: <span style={{ color: '#FF8906', fontWeight: 700, fontSize: '18px' }}>₹{selectedEvent.raw.amount}</span>
                  </p>
                  <p style={{ color: '#A7A9BE', fontSize: '13px' }}>
                    Status: <span style={{ color: '#FF6584', fontWeight: 600 }}>Unpaid</span>
                  </p>
                </div>
              )}
              {selectedEvent.type === 'reminder' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleSnoozeReminder(selectedEvent.raw._id)}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A7A9BE', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <AlarmClock size={14} /> Snooze
                  </button>
                  <button
                    onClick={() => handleDeleteReminder(selectedEvent.raw._id)}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,101,132,0.3)', background: 'rgba(255,101,132,0.1)', color: '#FF6584', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
